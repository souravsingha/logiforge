import { Router } from "express";
import { z } from "zod";
import pool from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/",async(req,res,next)=>{
  try{
    const locationId=String(req.query.locationId||"");
    const itemId=String(req.query.itemId||"");
    const result=await pool.query(`
      SELECT df.*,l.code AS location_code,i.name AS item_name,i.category
      FROM demand_forecasts df JOIN locations l ON l.id=df.location_id JOIN items i ON i.id=df.item_id
      WHERE ($1='' OR df.location_id=$1::uuid) AND ($2='' OR df.item_id=$2::uuid)
      ORDER BY df.forecast_date ASC LIMIT 500
    `,[locationId,itemId]);
    res.json({success:true,data:result.rows});
  }catch(error){next(error);}
});

router.post("/baseline",authorize("ADMIN","LOGISTICS_PLANNER","ANALYST"),async(req,res,next)=>{
  try{
    const b=z.object({locationId:z.string().uuid(),itemId:z.string().uuid(),horizon:z.number().int().min(1).max(30).default(7)}).parse(req.body);
    const history=await pool.query(`
      SELECT consumption_date,quantity FROM consumption_history
      WHERE location_id=$1 AND item_id=$2 ORDER BY consumption_date DESC LIMIT 30
    `,[b.locationId,b.itemId]);
    if(!history.rows.length) return res.status(400).json({success:false,message:"No consumption history available"});
    const avg =
  history.rows.reduce(
    (sum: number, row: { quantity: number | string }) =>
      sum + Number(row.quantity),
    0
  ) / history.rows.length;
    const run=await pool.query(`INSERT INTO optimization_runs(run_type,status,created_by,input_summary) VALUES('FORECAST','COMPLETED',$1,$2) RETURNING id`,[req.user!.id,JSON.stringify({method:"moving_average",historyPoints:history.rows.length,average:avg})]);
    const rows=[];
    for(let d=1;d<=b.horizon;d++){
      const date=new Date(Date.now()+d*86400000).toISOString().slice(0,10);
      const result=await pool.query(`
        INSERT INTO demand_forecasts(location_id,item_id,forecast_date,predicted_quantity,model_name,model_version,horizon_days,source)
        VALUES($1,$2,$3,$4,'Moving Average','baseline-1.0',$5,'synthetic-consumption') RETURNING *
      `,[b.locationId,b.itemId,date,Number(avg.toFixed(2)),b.horizon]);
      rows.push(result.rows[0]);
    }
    res.status(201).json({success:true,runId:run.rows[0].id,method:"moving_average",data:rows});
  }catch(error){next(error);}
});

export default router;