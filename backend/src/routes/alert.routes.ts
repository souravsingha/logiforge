import { Router } from "express";
import pool from "../config/database.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

/*
  GET /api/alerts
  Optional:
  ?resolved=true
  ?resolved=false
*/
router.get("/", async (req, res, next) => {
  try {
    const resolved = req.query.resolved;

    const result = await pool.query(
      `
      SELECT
        a.*,
        l.code AS location_code,
        i.name AS item_name
      FROM alerts a
      LEFT JOIN locations l ON l.id = a.location_id
      LEFT JOIN items i ON i.id = a.item_id
      WHERE ($1 = '' OR a.is_resolved = $1::boolean)
      ORDER BY
        CASE a.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'WARNING' THEN 2
          ELSE 3
        END,
        a.created_at DESC
      `,
      [resolved === undefined ? "" : String(resolved)]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

/*
  POST /api/alerts/scan

  Forecast + Inventory
  --------------------
  Detects projected stock-out risk and
  creates explainable alerts.

  CRITICAL:
    Stock-out within 3 days
    OR current inventory status is RED

  WARNING:
    Stock-out within 7 days
    OR current inventory status is AMBER

  INFO:
    No alert is generated for GREEN inventory.
*/
router.post(
  "/scan",
  authorize("ADMIN", "LOGISTICS_PLANNER", "ANALYST"),
  async (req, res, next) => {
    try {
      const inventoryResult = await pool.query(`
        SELECT
          inv.id AS inventory_id,
          inv.location_id,
          inv.item_id,
          inv.current_quantity,
          inv.daily_average_consumption,
          inv.days_of_supply,
          inv.status,

          l.code AS location_code,
          l.name AS location_name,

          i.code AS item_code,
          i.name AS item_name,
          i.category,
          i.unit,
          i.minimum_days

        FROM inventory inv
        JOIN locations l
          ON l.id = inv.location_id
        JOIN items i
          ON i.id = inv.item_id

        WHERE l.is_active = true
          AND i.is_active = true

        ORDER BY l.code, i.name
      `);

      let scanned = 0;
      let created = 0;
      let skipped = 0;

      const generatedAlerts = [];

      for (const inventory of inventoryResult.rows) {
        scanned++;

        const forecastResult = await pool.query(
          `
          SELECT
            forecast_date,
            predicted_quantity
          FROM demand_forecasts

          WHERE location_id = $1
            AND item_id = $2
            AND forecast_date >= CURRENT_DATE

          ORDER BY forecast_date ASC
          LIMIT 30
          `,
          [inventory.location_id, inventory.item_id]
        );

        /*
          If forecast does not exist, we cannot perform
          predictive stock-out detection.
        */
        if (!forecastResult.rows.length) {
          skipped++;
          continue;
        }

        let projectedStock = Number(
          inventory.current_quantity
        );

        let stockoutDay: number | null = null;
        let cumulativeDemand = 0;

        for (
          let index = 0;
          index < forecastResult.rows.length;
          index++
        ) {
          const demand = Number(
            forecastResult.rows[index].predicted_quantity
          );

          cumulativeDemand += demand;
          projectedStock -= demand;

          if (projectedStock <= 0) {
            stockoutDay = index + 1;
            break;
          }
        }

        /*
          Forecast does not reach zero, but current inventory
          status itself is already RED / AMBER.
        */
        const currentStatus = String(
          inventory.status
        ).toUpperCase();

        let severity: "CRITICAL" | "WARNING" | null = null;

        if (
          stockoutDay !== null &&
          stockoutDay <= 3
        ) {
          severity = "CRITICAL";
        } else if (
          currentStatus === "RED"
        ) {
          severity = "CRITICAL";
        } else if (
          stockoutDay !== null &&
          stockoutDay <= 7
        ) {
          severity = "WARNING";
        } else if (
          currentStatus === "AMBER"
        ) {
          severity = "WARNING";
        }

        /*
          GREEN + sufficient forecast coverage:
          no alert required.
        */
        if (!severity) {
          skipped++;
          continue;
        }

        let title = "";
        let message = "";

        if (stockoutDay !== null) {
          if (severity === "CRITICAL") {
            title = `${inventory.location_code} · ${inventory.item_name} stock-out risk`;

            message =
              `${inventory.item_name} at ${inventory.location_code} ` +
              `is projected to reach stock-out within ${stockoutDay} ` +
              `${stockoutDay === 1 ? "day" : "days"} based on current ` +
              `inventory of ${Number(inventory.current_quantity).toFixed(2)} ` +
              `${inventory.unit} and forecasted demand.`;
          } else {
            title = `${inventory.location_code} · ${inventory.item_name} low-stock forecast`;

            message =
              `${inventory.item_name} at ${inventory.location_code} ` +
              `is projected to reach stock-out in approximately ` +
              `${stockoutDay} days based on forecasted demand. ` +
              `Current inventory is ${Number(
                inventory.current_quantity
              ).toFixed(2)} ${inventory.unit}.`;
          }
        } else {
          title =
            `${inventory.location_code} · ${inventory.item_name} ` +
            `inventory risk`;

          message =
            `${inventory.item_name} at ${inventory.location_code} ` +
            `has a ${currentStatus} inventory status and requires ` +
            `planner review. Current stock is ${Number(
              inventory.current_quantity
            ).toFixed(2)} ${inventory.unit}, with approximately ` +
            `${Number(inventory.days_of_supply).toFixed(1)} days ` +
            `of supply remaining.`;
        }

        /*
          Prevent duplicate unresolved alerts for the
          same location + item + alert type.
        */
        const existing = await pool.query(
          `
          SELECT id
          FROM alerts

          WHERE location_id = $1
            AND item_id = $2
            AND alert_type = 'STOCKOUT_RISK'
            AND is_resolved = false

          LIMIT 1
          `,
          [
            inventory.location_id,
            inventory.item_id,
          ]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        const inserted = await pool.query(
          `
          INSERT INTO alerts (
            alert_type,
            severity,
            title,
            message,
            location_id,
            item_id
          )

          VALUES (
            'STOCKOUT_RISK',
            $1,
            $2,
            $3,
            $4,
            $5
          )

          RETURNING *
          `,
          [
            severity,
            title,
            message,
            inventory.location_id,
            inventory.item_id,
          ]
        );

        created++;

        generatedAlerts.push({
          ...inserted.rows[0],
          location_code:
            inventory.location_code,
          item_name:
            inventory.item_name,
          stockout_day:
            stockoutDay,
          current_quantity:
            Number(inventory.current_quantity),
          cumulative_forecast_demand:
            Number(cumulativeDemand.toFixed(2)),
        });
      }

      res.json({
        success: true,
        message:
          created > 0
            ? `Risk scan completed. ${created} new alert(s) generated.`
            : "Risk scan completed. No new alerts generated.",
        summary: {
          inventoryRecordsScanned: scanned,
          alertsCreated: created,
          recordsSkipped: skipped,
        },
        data: generatedAlerts,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
  PATCH /api/alerts/:id/resolve
*/
router.patch(
  "/:id/resolve",
  authorize("ADMIN", "LOGISTICS_PLANNER"),
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `
        UPDATE alerts

        SET
          is_resolved = true,
          resolved_by = $1,
          resolved_at = NOW()

        WHERE id = $2

        RETURNING *
        `,
        [
          req.user!.id,
          req.params.id,
        ]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          success: false,
          message: "Alert not found",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;