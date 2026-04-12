const templateService = require('./template.service');

/**
 * GET /api/v1/templates
 * List all available templates.
 */
async function listTemplates(_req, res, next) {
  try {
    const templates = await templateService.list();
    res.json({ data: templates });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/templates/:id/apply
 * Apply a template to the authenticated user's business (deep copy).
 * One-time only — reject if business already has menu data.
 */
async function applyTemplate(req, res, next) {
  try {
    const templateId = req.params.id;

    // Check template exists
    const template = await templateService.getById(templateId);
    if (!template) {
      return res.status(404).json({
        error: { status: 404, message: 'Template not found' },
      });
    }

    // One-time check: reject if already applied
    const alreadyApplied = await templateService.hasAppliedTemplate(req.tenantId);
    if (alreadyApplied) {
      return res.status(409).json({
        error: { status: 409, message: 'Template already applied to this business' },
      });
    }

    const result = await templateService.applyTemplate(templateId, req.tenantId);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/templates/status
 * Check whether the current business has completed setup (template applied or skipped).
 */
async function getSetupStatus(req, res, next) {
  try {
    const applied = await templateService.hasAppliedTemplate(req.tenantId);
    res.json({ data: { setup_complete: applied } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/templates/skip
 * Mark setup as complete without applying a template (Custom / start from scratch).
 */
async function skipTemplate(req, res, next) {
  try {
    const alreadyApplied = await templateService.hasAppliedTemplate(req.tenantId);
    if (alreadyApplied) {
      return res.status(409).json({
        error: { status: 409, message: 'Setup already completed' },
      });
    }

    await templateService.markSetupComplete(req.tenantId);
    res.json({ data: { setup_complete: true } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTemplates, applyTemplate, getSetupStatus, skipTemplate };
