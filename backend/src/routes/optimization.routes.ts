import { Router } from "express";
import { z } from "zod";
import pool from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/runs",async(_req,res,next)=>{
  try{
    const result=await pool.query(`SELECT * FROM optimization_runs ORDER BY created_at DESC LIMIT 50`);
    res.json({success:true,data:result.rows});
  }catch(error){next(error);}
});

router.post("/run",authorize("ADMIN","LOGISTICS_PLANNER","ANALYST"),async(req,res,next)=>{
  try{
    const b=z.object({scenarioId:z.string().uuid().optional()}).parse(req.body);
    const inputs=await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM supply_requests WHERE status IN ('SUBMITTED','UNDER_REVIEW','PLANNED','APPROVED'))::int AS requests,
        (SELECT COALESCE(SUM(current_quantity),0) FROM inventory)::numeric AS inventory,
        (SELECT COALESCE(SUM(capacity),0) FROM transport_assets WHERE status='AVAILABLE')::numeric AS transport_capacity
    `);

    const run=await pool.query(`
      INSERT INTO optimization_runs(run_type,status,created_by,scenario_id,input_summary,solver_name)
      VALUES('ALLOCATION','COMPLETED',$1,$2,$3,'baseline-rule-engine') RETURNING *
    `,[req.user!.id,b.scenarioId||null,JSON.stringify(inputs.rows[0])]);

    const requests=await pool.query(`
      SELECT sr.id,sr.request_code,sr.quantity,sr.priority,l.code AS destination_code,i.name AS item_name
      FROM supply_requests sr JOIN locations l ON l.id=sr.location_id JOIN items i ON i.id=sr.item_id
      WHERE sr.status IN ('SUBMITTED','UNDER_REVIEW','PLANNED','APPROVED')
      ORDER BY CASE sr.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END
      LIMIT 25
    `);

    const plan=requests.rows.map((r:any,index:number)=>({
      requestId:r.id,requestCode:r.request_code,item:r.item_name,destination:r.destination_code,
      allocatedQuantity:Number(r.quantity),priority:r.priority,
      source:"Nearest available synthetic depot",transport:"Available synthetic asset",
      modeledCost:Number((Number(r.quantity)*(1+index*.03)).toFixed(2)),
      explanation:[
        `${r.destination_code} request priority is ${r.priority}.`,
        "Current inventory and pending demand are included in the planning input.",
        "A synthetic depot and available transport option are selected for demonstration.",
        "Final recommendation requires human review."
      ]
    }));

    await pool.query(`UPDATE optimization_runs SET output_summary=$1 WHERE id=$2`,[JSON.stringify({plan}),run.rows[0].id]);

    res.status(201).json({success:true,data:{run:run.rows[0],plan}});
  }catch(error){next(error);}
});

export default router;