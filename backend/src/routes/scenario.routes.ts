import { Router } from "express";
import { z } from "zod";
import pool from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/",async(_req,res,next)=>{
  try{
    const result=await pool.query(`SELECT * FROM scenarios ORDER BY created_at DESC`);
    res.json({success:true,data:result.rows});
  }catch(error){next(error);}
});

router.post("/run",authorize("ADMIN","LOGISTICS_PLANNER","ANALYST"),async(req,res,next)=>{
  try{
    const b=z.object({
      name:z.string().min(3).max(150),
      type:z.enum(["DEMAND_INCREASE","TRANSPORT_REDUCTION","ROUTE_UNAVAILABLE","SUPPLY_DELAY","INVENTORY_REDUCTION","WEATHER_DISRUPTION"]),
      parameter:z.number().default(30)
    }).parse(req.body);

    const baseline=await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(current_quantity),0) FROM inventory)::numeric AS stock,
        (SELECT COUNT(*) FROM supply_requests WHERE status IN ('SUBMITTED','UNDER_REVIEW','PLANNED','APPROVED'))::int AS pending
    `);

    const scenario=await pool.query(`
      INSERT INTO scenarios(name,type,parameter,status,created_by,baseline_snapshot)
      VALUES($1,$2,$3,'OPEN',$4,$5) RETURNING *
    `,[b.name,b.type,b.parameter,req.user!.id,JSON.stringify(baseline.rows[0])]);

    const impact = b.type==="TRANSPORT_REDUCTION"
      ? `Transport capacity reduced by ${b.parameter}%. Pending requests may require re-planning.`
      : `${b.type.replaceAll("_"," ")} scenario applied with parameter ${b.parameter}.`;

    res.status(201).json({
      success:true,
      data:{
        scenario:scenario.rows[0],
        impact,
        baseline:baseline.rows[0],
        recommendation:"Recalculate allocation and review affected requests before approval."
      }
    });
  }catch(error){next(error);}
});

router.post("/:id/close",authorize("ADMIN","LOGISTICS_PLANNER"),async(req,res,next)=>{
  try{
    const result=await pool.query(`UPDATE scenarios SET status='CLOSED',closed_at=NOW() WHERE id=$1 RETURNING *`,[req.params.id]);
    if(!result.rows[0]) return res.status(404).json({success:false,message:"Scenario not found"});
    res.json({success:true,data:result.rows[0]});
  }catch(error){next(error);}
});

export default router;