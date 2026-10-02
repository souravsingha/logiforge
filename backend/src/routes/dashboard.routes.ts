import { Router } from "express";
import pool from "../config/database.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/summary", async (_req, res, next) => {
  try {
    const [
      locations,
      criticalLocations,
      pendingRequests,
      assets,
      lowInventory,
      shortages,
      scenarios
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM locations WHERE is_active = true`),
      pool.query(`SELECT COUNT(*)::int AS count FROM inventory WHERE status = 'RED'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM supply_requests WHERE status IN ('SUBMITTED','UNDER_REVIEW','PLANNED','APPROVED')`),
      pool.query(`SELECT COUNT(*)::int AS count FROM transport_assets WHERE status IN ('AVAILABLE','IN_TRANSIT')`),
      pool.query(`SELECT COUNT(*)::int AS count FROM inventory WHERE status IN ('AMBER','RED')`),
      pool.query(`SELECT COUNT(*)::int AS count FROM alerts WHERE severity IN ('CRITICAL','WARNING') AND is_resolved = false`),
      pool.query(`SELECT COUNT(*)::int AS count FROM scenarios WHERE status = 'OPEN'`)
    ]);

    res.json({
      success: true,
      data: {
        totalLocations: locations.rows[0].count,
        criticalLocations: criticalLocations.rows[0].count,
        pendingRequests: pendingRequests.rows[0].count,
        activeTransportAssets: assets.rows[0].count,
        lowInventoryItems: lowInventory.rows[0].count,
        predictedShortages: shortages.rows[0].count,
        openScenarios: scenarios.rows[0].count
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/overview", async (_req, res, next) => {
  try {
    const [summary, alerts, requests, inventory] = await Promise.all([
      pool.query(`SELECT
        (SELECT COUNT(*) FROM locations WHERE is_active=true)::int AS locations,
        (SELECT COUNT(*) FROM inventory WHERE status='RED')::int AS critical_inventory,
        (SELECT COUNT(*) FROM supply_requests WHERE status IN ('SUBMITTED','UNDER_REVIEW','PLANNED','APPROVED'))::int AS pending_requests,
        (SELECT COUNT(*) FROM transport_assets WHERE status IN ('AVAILABLE','IN_TRANSIT'))::int AS active_assets`),
      pool.query(`SELECT id, severity, alert_type, title, message, created_at FROM alerts
                  WHERE is_resolved=false ORDER BY created_at DESC LIMIT 8`),
      pool.query(`SELECT sr.id, sr.request_code, sr.quantity, sr.priority, sr.status, sr.required_by,
                         l.code AS location_code, i.name AS item_name
                  FROM supply_requests sr
                  JOIN locations l ON l.id=sr.location_id
                  JOIN items i ON i.id=sr.item_id
                  ORDER BY sr.created_at DESC LIMIT 8`),
      pool.query(`SELECT inv.id, l.code AS location_code, i.name AS item_name, i.category,
                         inv.current_quantity, inv.daily_average_consumption, inv.days_of_supply, inv.status
                  FROM inventory inv JOIN locations l ON l.id=inv.location_id JOIN items i ON i.id=inv.item_id
                  ORDER BY CASE inv.status WHEN 'RED' THEN 1 WHEN 'AMBER' THEN 2 ELSE 3 END, inv.days_of_supply ASC
                  LIMIT 10`)
    ]);

    res.json({ success: true, data: {
      summary: summary.rows[0],
      alerts: alerts.rows,
      requests: requests.rows,
      inventory: inventory.rows
    }});
  } catch (error) {
    next(error);
  }
});

export default router;