import { Router } from "express";
import { z } from "zod";
import pool from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

const locationSchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  type: z.enum(["CENTRAL_DEPOT","REGIONAL_DEPOT","FORWARD_LOCATION","DISTRIBUTION_POINT"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  storageCapacity: z.number().nonnegative().default(1000),
  priorityLevel: z.number().int().min(1).max(5).default(3)
});

router.get("/", async (_req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT l.*,
        COALESCE(SUM(inv.current_quantity),0)::numeric AS total_stock,
        COUNT(DISTINCT inv.item_id)::int AS item_count
      FROM locations l
      LEFT JOIN inventory inv ON inv.location_id=l.id
      WHERE l.is_active=true
      GROUP BY l.id
      ORDER BY l.code
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const location = await pool.query(`SELECT * FROM locations WHERE id=$1`, [req.params.id]);
    if (!location.rows[0]) return res.status(404).json({ success:false,message:"Location not found" });

    const inventory = await pool.query(`
      SELECT inv.*, i.code AS item_code, i.name AS item_name, i.category, i.unit
      FROM inventory inv JOIN items i ON i.id=inv.item_id
      WHERE inv.location_id=$1 ORDER BY i.category,i.name
    `, [req.params.id]);

    res.json({ success:true,data:{location:location.rows[0],inventory:inventory.rows} });
  } catch (error) { next(error); }
});

router.post("/", authorize("ADMIN","LOGISTICS_PLANNER"), async (req, res, next) => {
  try {
    const body=locationSchema.parse(req.body);
    const result=await pool.query(`
      INSERT INTO locations (code,name,type,latitude,longitude,storage_capacity,priority_level)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `,[body.code,body.name,body.type,body.latitude,body.longitude,body.storageCapacity,body.priorityLevel]);
    res.status(201).json({success:true,data:result.rows[0]});
  } catch(error){next(error);}
});

export default router;