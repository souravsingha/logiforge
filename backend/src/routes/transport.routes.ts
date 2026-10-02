import { Router } from "express";
import pool from "../config/database.js";
import { authenticate } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/assets",async(_req,res,next)=>{
  try{
    const result=await pool.query(`SELECT * FROM transport_assets ORDER BY status,vehicle_code`);
    res.json({success:true,data:result.rows});
  }catch(error){next(error);}
});

router.get("/routes",async(_req,res,next)=>{
  try{
    const result=await pool.query(`
      SELECT r.*,a.code AS from_code,b.code AS to_code
      FROM routes r JOIN locations a ON a.id=r.from_location_id JOIN locations b ON b.id=r.to_location_id
      ORDER BY r.route_code
    `);
    res.json({success:true,data:result.rows});
  }catch(error){next(error);}
});

export default router;