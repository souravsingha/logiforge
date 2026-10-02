import { Router } from "express";
import { z } from "zod";
import pool from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/", async(req,res,next)=>{
  try{
    const result=await pool.query(`
      SELECT sr.*, l.code AS location_code,l.name AS location_name,i.code AS item_code,i.name AS item_name,i.category
      FROM supply_requests sr
      JOIN locations l ON l.id=sr.location_id
      JOIN items i ON i.id=sr.item_id
      ORDER BY CASE sr.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, sr.created_at DESC
    `);
    res.json({success:true,data:result.rows});
  }catch(error){next(error);}
});

const createSchema=z.object({
  locationId:z.string().uuid(),
  itemId:z.string().uuid(),
  quantity:z.number().positive(),
  requiredBy:z.string(),
  priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).default("MEDIUM"),
  reason:z.string().min(3).max(500)
});

router.post("/", authorize("ADMIN","LOGISTICS_PLANNER","FIELD_OPERATOR"), async(req,res,next)=>{
  try{
    const b=createSchema.parse(req.body);
    const code=`REQ-${Date.now().toString().slice(-8)}`;
    const result=await pool.query(`
      INSERT INTO supply_requests(request_code,location_id,item_id,quantity,required_by,priority,reason,created_by,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,'SUBMITTED') RETURNING *
    `,[code,b.locationId,b.itemId,b.quantity,b.requiredBy,b.priority,b.reason,req.user!.id]);
    res.status(201).json({success:true,data:result.rows[0]});
  }catch(error){next(error);}
});

router.patch("/:id/status", authorize("ADMIN","LOGISTICS_PLANNER"), async(req,res,next)=>{
  try{
    const schema=z.object({status:z.enum(["DRAFT","SUBMITTED","UNDER_REVIEW","PLANNED","APPROVED","IN_TRANSIT","DELIVERED","CLOSED","CANCELLED"])});
    const b=schema.parse(req.body);
    const result=await pool.query(`UPDATE supply_requests SET status=$1,reviewed_by=$2,reviewed_at=NOW(),updated_at=NOW() WHERE id=$3 RETURNING *`,[b.status,req.user!.id,req.params.id]);
    if(!result.rows[0]) return res.status(404).json({success:false,message:"Request not found"});
    res.json({success:true,data:result.rows[0]});
  }catch(error){next(error);}
});

export default router;