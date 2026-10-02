import { Router } from "express";
import pool from "../config/database.js";
import { authenticate } from "../middleware/auth.js";

const router=Router();
router.use(authenticate);

router.post("/query",async(req,res,next)=>{
  try{
    const question=String(req.body?.question||"").trim();
    if(!question) return res.status(400).json({success:false,message:"Question is required"});

    const [alerts,inventory,requests]=await Promise.all([
      pool.query(`SELECT severity,title,message FROM alerts WHERE is_resolved=false ORDER BY created_at DESC LIMIT 5`),
      pool.query(`SELECT l.code AS location,i.name AS item,inv.days_of_supply,inv.status FROM inventory inv JOIN locations l ON l.id=inv.location_id JOIN items i ON i.id=inv.item_id WHERE inv.status IN ('RED','AMBER') ORDER BY inv.days_of_supply ASC LIMIT 5`),
      pool.query(`SELECT COUNT(*)::int AS count FROM supply_requests WHERE status IN ('SUBMITTED','UNDER_REVIEW','PLANNED','APPROVED')`)
    ]);

    const answer=`Based on current system data: ${alerts.rows.length} active alerts are visible, ${inventory.rows.length} inventory records are in AMBER/RED status, and ${requests.rows[0].count} supply requests are pending review. This response uses database records only; it does not invent operational facts.`;

    res.json({success:true,data:{question,answer,alerts:alerts.rows,inventoryRisks:inventory.rows,pendingRequests:requests.rows[0].count}});
  }catch(error){next(error);}
});

export default router;