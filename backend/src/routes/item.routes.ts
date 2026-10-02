import { Router } from "express";
import pool from "../config/database.js";
import { authenticate } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.get("/", async (_req,res,next)=>{
  try{
    const result=await pool.query(`SELECT * FROM items WHERE is_active=true ORDER BY category,name`);
    res.json({success:true,data:result.rows});
  }catch(error){next(error);}
});

export default router;