import { Router } from "express";
import { z } from "zod";
import pool from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

function statusFor(days:number, minimum:number){
  if(days <= Math.max(minimum, 2)) return "RED";
  if(days <= Math.max(minimum * 2, 5)) return "AMBER";
  return "GREEN";
}

router.get("/", async (req,res,next)=>{
  try{
    const q=String(req.query.search||"");
    const result=await pool.query(`
      SELECT inv.*, l.code AS location_code, l.name AS location_name,
             i.code AS item_code, i.name AS item_name, i.category, i.unit
      FROM inventory inv
      JOIN locations l ON l.id=inv.location_id
      JOIN items i ON i.id=inv.item_id
      WHERE ($1='' OR l.code ILIKE '%'||$1||'%' OR i.name ILIKE '%'||$1||'%')
      ORDER BY CASE inv.status WHEN 'RED' THEN 1 WHEN 'AMBER' THEN 2 ELSE 3 END, inv.days_of_supply ASC
    `,[q]);
    res.json({success:true,data:result.rows});
  }catch(error){next(error);}
});

router.get("/:id", async(req,res,next)=>{
  try{
    const result=await pool.query(`
      SELECT inv.*, l.code AS location_code, l.name AS location_name,
             i.code AS item_code, i.name AS item_name, i.category, i.unit
      FROM inventory inv JOIN locations l ON l.id=inv.location_id JOIN items i ON i.id=inv.item_id
      WHERE inv.id=$1
    `,[req.params.id]);
    if(!result.rows[0]) return res.status(404).json({success:false,message:"Inventory record not found"});
    res.json({success:true,data:result.rows[0]});
  }catch(error){next(error);}
});

const updateSchema=z.object({
  currentQuantity:z.number().nonnegative(),
  minimumThreshold:z.number().nonnegative(),
  maximumCapacity:z.number().positive(),
  dailyAverageConsumption:z.number().nonnegative()
});

router.patch("/:id", authorize("ADMIN","DEPOT_MANAGER","FIELD_OPERATOR"), async(req,res,next)=>{
  try{
    const body=updateSchema.parse(req.body);
    const days=body.dailyAverageConsumption===0?999:body.currentQuantity/body.dailyAverageConsumption;
    const status=statusFor(days, body.minimumThreshold>0?body.minimumThreshold/body.dailyAverageConsumption:3);
    const result=await pool.query(`
      UPDATE inventory SET current_quantity=$1,minimum_threshold=$2,maximum_capacity=$3,
      daily_average_consumption=$4,days_of_supply=$5,status=$6,last_updated=NOW()
      WHERE id=$7 RETURNING *
    `,[body.currentQuantity,body.minimumThreshold,body.maximumCapacity,body.dailyAverageConsumption,days,status,req.params.id]);
    if(!result.rows[0]) return res.status(404).json({success:false,message:"Inventory record not found"});
    res.json({success:true,data:result.rows[0]});
  }catch(error){next(error);}
});

export default router;