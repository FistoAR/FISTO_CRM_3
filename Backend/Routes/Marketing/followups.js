const express = require("express");
const router = express.Router();
const {
  queryWithRetry,
  getConnectionWithRetry,
} = require("../../dataBase/connection");

router.post("/", async (req, res) => {
  const {
    clientID,
    contactPersonID,
    status,
    remarks,
    nextFollowup,
    newContact = {},
    meetingData = {},
    shareViaEmail = false,
    shareViaWhatsApp = false,
    subTab
  } = req.body;

  if (!clientID || !status) {
    return res.status(400).json({
      error: "Client ID and status are required",
    });
  }

  try {
    const hasAnyField =
      (newContact.name && newContact.name.trim()) ||
      (newContact.contactNumber && newContact.contactNumber.trim());
    let contactID = contactPersonID;

    if (hasAnyField && subTab === "not_available") {
      const result = await queryWithRetry(
        `INSERT INTO ContactPersons 
        (clientID, name, contactNumber, email, designation)
         VALUES (?, ?, ?, ?, ?)`,
        [
          clientID,
          newContact.name || null,
          newContact.contactNumber || null,
          newContact.email || null,
          newContact.designation || null,
        ]
      );
      contactID = result.insertId;
    }

    let sharedStatus = null;
    if (shareViaWhatsApp && shareViaEmail) {
      sharedStatus = "both";
    } else if (shareViaWhatsApp) {
      sharedStatus = "whatsapp";
    } else if (shareViaEmail) {
      sharedStatus = "email";
    }

    const followupResult = await queryWithRetry(
      `INSERT INTO Followups 
      (clientID, contactPersonID, status, remarks, nextFollowupDate, shared)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        clientID,
        contactID || null,
        status,
        remarks || null,
        nextFollowup || null,
        sharedStatus,
      ]
    );

    const followupId = followupResult.insertId;

    const hasMeetingData = 
      meetingData.title?.trim() && 
      meetingData.date && 
      meetingData.startTime && 
      meetingData.endTime;

    if (hasMeetingData) {
      await queryWithRetry(
        `INSERT INTO Marketing_meetings 
        (clientID, followupID, title, date, startTime, endTime, agenda, link, attendees)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clientID,
          followupId,
          meetingData.title,
          meetingData.date,
          meetingData.startTime,
          meetingData.endTime,
          meetingData.agenda || null,
          meetingData.link || null,
          meetingData.attendees || null,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "Followup added successfully",
      followupId: followupId,
    });
  } catch (err) {
    console.error("Error adding followup:", err);
    res.status(500).json({ error: "Failed to add followup" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    if (!status) {
      return res.status(400).json({ error: "Status query is required" });
    }

    const latestStatusQuery = `
      SELECT 
        f.*,
        c.id as clientID,
        c.company_name,
        c.customer_name,
        c.industry_type,
        c.website,
        c.address,
        c.city,
        c.state,
        c.reference,
        c.requirements,
        c.created_at AS client_created_at,
        c.updated_at AS client_updated_at
      FROM Followups f
      JOIN (
        SELECT clientID, MAX(created_at) AS last_date
        FROM Followups
        GROUP BY clientID
      ) lf ON f.clientID = lf.clientID AND f.created_at = lf.last_date
      JOIN ClientsData c ON f.clientID = c.id
      WHERE f.status = ? AND c.active = 1
    `;

    const latestRows = await queryWithRetry(latestStatusQuery, [status]);
    const matchedClientIDs = latestRows.map((r) => r.clientID);

    let noFollowupClients = [];

    if (status === "first_followup") {
      const noFollowupQuery = `
        SELECT 
          c.id AS clientID,
          c.company_name,
          c.customer_name,
          c.industry_type,
          c.website,
          c.address,
          c.city,
          c.state,
          c.reference,
          c.requirements,
          c.created_at AS client_created_at,
          c.updated_at AS client_updated_at
        FROM ClientsData c
        LEFT JOIN Followups f ON c.id = f.clientID
        WHERE f.clientID IS NULL AND c.active = 1
        ORDER BY c.created_at DESC
      `;

      noFollowupClients = await queryWithRetry(noFollowupQuery);
    }

    const clientIDs = [
      ...matchedClientIDs,
      ...noFollowupClients.map((n) => n.clientID)
    ];

    if (clientIDs.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No clients match the given status"
      });
    }

    const placeholders = clientIDs.map(() => "?").join(",");

    const contactQuery = `
      SELECT * FROM ContactPersons
      WHERE clientID IN (${placeholders})
    `;
    const contactPersons = await queryWithRetry(contactQuery, clientIDs);

    const contactsGrouped = {};
    contactPersons.forEach((cp) => {
      if (!contactsGrouped[cp.clientID]) contactsGrouped[cp.clientID] = [];
      contactsGrouped[cp.clientID].push(cp);
    });

    const historyQuery = `
      SELECT 
        f.*,
        cp.name AS contact_person_name,
        cp.contactNumber,
        cp.email,
        cp.designation
      FROM Followups f
      LEFT JOIN ContactPersons cp ON f.contactPersonID = cp.id
      WHERE f.clientID IN (${placeholders})
      ORDER BY f.clientID, f.created_at DESC
    `;
    const history = await queryWithRetry(historyQuery, clientIDs);

    const meetingQuery = `
      SELECT 
        m.*,
        cp.name AS contact_person_name,
        f.status AS followup_status
      FROM Marketing_meetings m
      LEFT JOIN Followups f ON m.followupID = f.id
      LEFT JOIN ContactPersons cp ON f.contactPersonID = cp.id
      WHERE m.clientID IN (${placeholders})
      ORDER BY m.date DESC, m.startTime DESC
    `;
    const meetings = await queryWithRetry(meetingQuery, clientIDs);

    const meetingsGrouped = {};
    meetings.forEach((m) => {
      if (!meetingsGrouped[m.clientID]) meetingsGrouped[m.clientID] = [];
      meetingsGrouped[m.clientID].push(m);
    });

    const response = clientIDs.map((id) => {
      const latestFollow = latestRows.find((l) => l.clientID === id);
      const noFollow = noFollowupClients.find((n) => n.clientID === id);
      const clientData = latestFollow || noFollow;

      return {
        clientID: id,

        client_details: {
          id,
          company_name: clientData.company_name,
          customer_name: clientData.customer_name,
          industry_type: clientData.industry_type,
          website: clientData.website,
          address: clientData.address,
          city: clientData.city,
          state: clientData.state,
          reference: clientData.reference,
          requirements: clientData.requirements,
          created_at: latestFollow?.created_at || clientData.client_created_at,
          updated_at: clientData.client_updated_at,
          contactPersons: contactsGrouped[id] || [],
          nextFollowupDate: latestFollow ? latestFollow.nextFollowupDate:""
        },

        latest_status: latestFollow
          ? {
              id: latestFollow.id,
              status: latestFollow.status,
              remarks: latestFollow.remarks,
              created_at: latestFollow.created_at,
              followup_date: latestFollow.followup_date
            }
          : null,

        history: history.filter((h) => h.clientID === id),

        meetings: meetingsGrouped[id] || []   
      };
    });

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("Error fetching followup data:", error);
    res.status(500).json({ error: "Failed to fetch followups" });
  }
});


router.get("/client/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;

    const results = await queryWithRetry(
      `SELECT 
        f.*,
        cp.name as contact_person_name,
        cp.contactNumber,
        cp.email,
        cp.designation
       FROM Followups f
       LEFT JOIN ContactPersons cp ON f.contactPersonID = cp.id
       WHERE f.clientID = ?
       ORDER BY f.created_at DESC`,
      [clientId]
    );

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching client followups:", err);
    res.status(500).json({ error: "Failed to fetch followups" });
  }
});

module.exports = router;
