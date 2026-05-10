const express = require('express');
const Report = require('../models/Report');

const router = express.Router();

function buildPinPayload(reportDoc) {
  const desc = reportDoc.description || '';
  return {
    id: reportDoc._id.toString(),
    lat: reportDoc.lat,
    lng: reportDoc.lng,
    source: reportDoc.source,
    summary: reportDoc.summary,
    preview: desc.length > 320 ? `${desc.slice(0, 317)}…` : desc,
    timestamp: reportDoc.createdAt.toISOString(),
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const now = new Date();
    const reports = await Report.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const formatted = reports.map((r) => ({
      id: r._id.toString(),
      lat: r.lat,
      lng: r.lng,
      description: r.description,
      summary: r.summary,
      source: r.source,
      confidence: r.confidence,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { description, source } = req.body || {};
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      typeof description !== 'string' ||
      !description.trim()
    ) {
      return res.status(400).json({
        error: 'lat and lng must be finite numbers; description must be a non-empty string',
      });
    }

    const allowed = ['user', 'reddit', 'news'];
    const src = allowed.includes(source) ? source : 'user';

    const summary = description.trim().slice(0, 500);

    const report = await Report.create({
      lat,
      lng,
      description: description.trim(),
      summary,
      source: src,
      confidence: 1,
    });

    const io = req.app.get('io');
    const payload = buildPinPayload(report);
    io.emit('new_pin', payload);

    console.log('[reports] User/API report saved:', report._id.toString());
    console.log('[emit] new_pin (user report)', JSON.stringify(payload));

    res.status(201).json(report.toJSON());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
