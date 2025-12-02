const express = require("express");
const router = express.Router();
const db = require("../../dataBase/connection");

// API base path: /api/marketing/report-tasks

// Helper: format incoming date (Date or string) -> YYYY-MM-DD for MySQL
const formatDateForMySQL = (dateValue) => {
  if (!dateValue) return null;
  let date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === "string") {
    date = new Date(dateValue);
  } else {
    return null;
  }
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
};

// GET tasks for Report page - filtered by employee and date
router.get("/", (req, res) => {

  const { employee_name, task_type, seq_range, task_date } = req.query;

  // Use deterministic join on marketing_task.marketing_task_id = marketing_task_emp.task_id
  // while still respecting time_range mapping for CONCURRENT / SEQUENTIAL logic
  let query = `
    SELECT
      mt.marketing_task_id,
      mt.task_code,
      mt.task_name,
      mt.task_description,
      mt.task_type,
      mt.seq_range,
      mt.employee_id,
      mt.employee_name,
      mt.category,
      mt.assign_status,
      mt.task_date,
      mt.created_at,
      mt.updated_at,
      mt.is_active,
      mte.id as mte_id,
      mte.progress as emp_progress,
      mte.status as emp_status,
      mte.time_range as emp_time_range
    FROM marketing_task mt
    LEFT JOIN marketing_task_emp mte
      ON mt.marketing_task_id = mte.task_id
      AND (
        (mt.task_type = 'CONCURRENT' AND mte.time_range = 'today')
        OR
        (mt.task_type = 'SEQUENTIAL' AND mt.seq_range = 'TODAY' AND mte.time_range = 'today')
        OR
        (mt.task_type = 'SEQUENTIAL' AND mt.seq_range = 'WEEKLY' AND mte.time_range = 'weekly')
        OR
        (mt.task_type = 'SEQUENTIAL' AND mt.seq_range = 'MONTHLY' AND mte.time_range = 'monthly')
      )
    WHERE mt.is_active = 1
      AND mt.assign_status = 'ASSIGN'
  `;

  const params = [];

  if (employee_name) {
    query += " AND mt.employee_name = ?";
    params.push(employee_name);
  }

  if (task_type) {
    query += " AND mt.task_type = ?";
    params.push(task_type);
  }

  // Date filtering: For CONCURRENT tasks we may want today's tasks OR tasks earlier that are still in-progress
  if (task_date) {
    if (task_type === "CONCURRENT") {
      // show today's tasks OR tasks assigned before today with emp_status In Progress
      query += " AND (mt.task_date = ? OR (mt.task_date < ? AND COALESCE(mte.status, 'In Progress') = 'In Progress'))";
      params.push(task_date, task_date);
    } else {
      query += " AND mt.task_date = ?";
      params.push(task_date);
    }
  }

  if (seq_range) {
    query += " AND mt.seq_range = ?";
    params.push(seq_range);
  }

  query += " ORDER BY mt.created_at DESC";



  db.pool.query(query, params, (err, results) => {
    if (err) {
      console.error("Fetch report tasks error:", err);
      return res.status(500).json({
        status: false,
        message: "Database error",
        error: err.message,
      });
    }

    console.log(`Found ${results.length} tasks`);
    if (results.length > 0) {
      console.log("Sample task:", {
        name: results[0].task_name,
        date: results[0].task_date,
        type: results[0].task_type,
        status: results[0].emp_status,
        progress: results[0].emp_progress,
        time_range: results[0].emp_time_range,
      });
    }

    res.json({
      status: true,
      tasks: results,
    });
  });
});

// POST /api/marketing/report-tasks/:id/report
// Save a report (history) and update/create the marketing_task_emp row (identified by task_id)
router.post("/:id/report", (req, res) => {
  const taskId = req.params.id; // this is marketing_task.marketing_task_id
  const { progress, status, remarks, employee_id, employee_name } = req.body;

  // Validate required fields
  if (
    progress === undefined ||
    progress === null ||
    !status ||
    !remarks ||
    !String(remarks).trim() ||
    !employee_id ||
    !employee_name
  ) {
    return res.status(400).json({
      status: false,
      message: "progress, status, remarks, employee_id, employee_name are required",
    });
  }

  const pct = Number(progress);
  if (Number.isNaN(pct) || pct < 0 || pct > 100) {
    return res.status(400).json({
      status: false,
      message: "progress must be between 0 and 100",
    });
  }

  if (status === "Completed" && pct !== 100) {
    return res.status(400).json({
      status: false,
      message: "Completed status requires 100% progress",
    });
  }

  db.pool.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error", err);
      return res.status(500).json({
        status: false,
        message: "Database connection error",
      });
    }

    connection.beginTransaction(async (txErr) => {
      if (txErr) {
        connection.release();
        console.error("Transaction error", txErr);
        return res.status(500).json({
          status: false,
          message: "Transaction error",
        });
      }

      const q = (sql, params = []) =>
        new Promise((resolve, reject) => {
          connection.query(sql, params, (e, r) => (e ? reject(e) : resolve(r)));
        });

      try {
        // 1) Get task from marketing_task
        const taskRows = await q(
          `
          SELECT 
            marketing_task_id,
            task_name, 
            task_description, 
            task_date, 
            task_type, 
            seq_range,
            created_at
          FROM marketing_task
          WHERE marketing_task_id = ?
        `,
          [taskId]
        );

        if (!taskRows.length) {
          throw new Error("Task not found");
        }

        const task = taskRows[0];
        console.log("Task fetched:", {
          task_name: task.task_name,
          task_date: task.task_date,
          task_type: task.task_type,
          seq_range: task.seq_range,
        });

        // 2) Determine taskDate (fallback to created_at) and normalize
        let taskDate = task.task_date;
        if (!taskDate) {
          taskDate = task.created_at || new Date();
        }
        taskDate = formatDateForMySQL(taskDate);
        if (!taskDate) throw new Error("Unable to determine valid task date");

        // 3) Map seq_range to time_range
        let timeRange = "today";
        if (task.task_type === "SEQUENTIAL") {
          if (task.seq_range === "WEEKLY") timeRange = "weekly";
          else if (task.seq_range === "MONTHLY") timeRange = "monthly";
          else timeRange = "today";
        } else if (task.task_type === "CONCURRENT") {
          timeRange = "today"; // concurrent tasks are evaluated for 'today'
        }


        // 4) Check if row exists in marketing_task_emp by task_id + time_range
        const empRows = await q(
          `
          SELECT id, progress
          FROM marketing_task_emp
          WHERE task_id = ? AND time_range = ?
        `,
          [taskId, timeRange]
        );

        let empTaskId;
        if (empRows.length > 0) {
          empTaskId = empRows[0].id;
        } else {
          const insEmp = await q(
            `
            INSERT INTO marketing_task_emp
              (task_id, task_name, task_description, date, time_range, progress, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 0, 'In Progress', NOW(), NOW())
          `,
            [taskId, task.task_name, task.task_description, taskDate, timeRange]
          );
          empTaskId = insEmp.insertId;
          console.log(`Created marketing_task_emp record with ID: ${empTaskId}`);
        }

        // 5) Insert into marketing_history_report using the marketing_task_emp.id as task_id
        console.log("Inserting history record");
        const insHist = await q(
          `
          INSERT INTO marketing_history_report
            (task_id, employee_id, employee_name, progress, status, remarks, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `,
          [empTaskId, employee_id, employee_name, pct, status, remarks]
        );

        console.log(`History record created with ID: ${insHist.insertId}`);

        // 6) Update marketing_task_emp with latest progress/status
        console.log("Updating marketing_task_emp with new progress/status");
        await q(
          `
          UPDATE marketing_task_emp
          SET progress = ?, status = ?, updated_at = NOW()
          WHERE id = ?
        `,
          [pct, status, empTaskId]
        );

        connection.commit((commitErr) => {
          if (commitErr) {
            return connection.rollback(() => {
              connection.release();
              console.error("Commit error", commitErr);
              res.status(500).json({
                status: false,
                message: "Failed to commit transaction",
              });
            });
          }

          connection.release();
          console.log("Report saved successfully");

          res.json({
            status: true,
            message: "Report saved successfully",
            history_id: insHist.insertId,
            task_emp_id: empTaskId,
          });
        });
      } catch (err) {
        connection.rollback(() => {
          connection.release();
          console.error("Report save error:", err);
          res.status(500).json({
            status: false,
            message: err.message || "Failed to save report",
            error: err.toString(),
          });
        });
      }
    });
  });
});

// GET /api/marketing/report-tasks/:id/history
// Fetch history for a given marketing_task (by marketing_task_id)
router.get("/:id/history", (req, res) => {
  const taskId = req.params.id; // marketing_task.marketing_task_id
  console.log(`Fetching history for task ID: ${taskId}`);

  const query = `
    SELECT
      h.id,
      h.employee_id,
      h.employee_name,
      h.progress,
      h.status,
      h.remarks,
      DATE_FORMAT(h.submitted_at, '%d/%m/%Y | %h:%i %p') as submitted_at
    FROM marketing_history_report h
    INNER JOIN marketing_task_emp e ON h.task_id = e.id
    INNER JOIN marketing_task t ON e.task_id = t.marketing_task_id
    WHERE t.marketing_task_id = ?
    ORDER BY h.submitted_at DESC
  `;

  db.pool.query(query, [taskId], (err, results) => {
    if (err) {
      console.error("Fetch history error:", err);
      return res.status(500).json({
        status: false,
        message: "Database error",
        error: err.message,
      });
    }

    console.log(`Found ${results.length} history records`);

    res.json({
      status: true,
      history: results,
    });
  });
});

module.exports = router;
