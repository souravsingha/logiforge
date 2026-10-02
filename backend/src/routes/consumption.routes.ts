import { Router } from "express";
import { z } from "zod";
import pool from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/", async(req,res,next)=>{
  try{
    const locationId=String(req.query.locationId||"");
    const itemId=String(req.query.itemId||"");
    const result=await pool.query(`
      SELECT ch.*, l.code AS location_code, i.name AS item_name, i.category
      FROM consumption_history ch
      JOIN locations l ON l.id=ch.location_id
      JOIN items i ON i.id=ch.item_id
      WHERE ($1='' OR ch.location_id=$1::uuid)
        AND ($2='' OR ch.item_id=$2::uuid)
      ORDER BY ch.consumption_date DESC LIMIT 500
    `,[locationId,itemId]);
    res.json({success:true,data:result.rows});
  }catch(error){next(error);}
});

const schema=z.object({
  locationId:z.string().uuid(),
  itemId:z.string().uuid(),
  consumptionDate:z.string(),
  quantity:z.number().nonnegative(),
  unit:z.string().min(1).max(30),
  scenarioTag:z.string().max(80).optional()
});

router.post("/", authorize("ADMIN","DEPOT_MANAGER","FIELD_OPERATOR"), async(req,res,next)=>{
  try{
    const b=schema.parse(req.body);
    const result=await pool.query(`
      INSERT INTO consumption_history(location_id,item_id,consumption_date,quantity,unit,scenario_tag,recorded_by)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `,[b.locationId,b.itemId,b.consumptionDate,b.quantity,b.unit,b.scenarioTag||null,req.user!.id]);
    res.status(201).json({success:true,data:result.rows[0]});
  }catch(error){next(error);}
});

export default router;