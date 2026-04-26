// ── Input Validation Schemas ──
import { body, param, validationResult } from 'express-validator';

// Middleware to check validation results and return 422
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const violations = errors.array().map(e => ({
      field: e.path,
      message: e.msg,
    }));
    return res.status(422).json({ error: 'Validation failed', violations });
  }
  next();
}

// ── Auth ──

export const registerRules = [
  body('email').trim().isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Name too long (max 100)'),
];

export const loginRules = [
  body('email').trim().isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Business ──

export const createBusinessRules = [
  body('templateKey').notEmpty().withMessage('templateKey is required'),
  body('templateData').isObject().withMessage('templateData must be an object'),
  body('businessName').optional().trim().isLength({ max: 100 }).withMessage('Business name too long (max 100)'),
];

export const updateBusinessRules = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone too long (max 20)'),
];

// ── Builder ──

const MAX_BUTTON_LABEL = 64;
const MAX_BUTTONS_PER_LEVEL = 10;
const MAX_MENU_DEPTH = 5;
const MAX_TEXT_LENGTH = 4096;

function validateButtonTree(buttons, depth = 0) {
  if (depth > MAX_MENU_DEPTH) return `Menu depth exceeds maximum of ${MAX_MENU_DEPTH} levels`;
  if (buttons.length > MAX_BUTTONS_PER_LEVEL) return `Too many buttons at one level (max ${MAX_BUTTONS_PER_LEVEL})`;

  for (const btn of buttons) {
    if (!btn.label || btn.label.length > MAX_BUTTON_LABEL) {
      return `Button label must be 1-${MAX_BUTTON_LABEL} characters`;
    }
    if (btn.children && btn.children.length > 0) {
      const err = validateButtonTree(btn.children, depth + 1);
      if (err) return err;
    }
    if (btn.infoPage) {
      const ip = btn.infoPage;
      if (ip.title && ip.title.length > MAX_TEXT_LENGTH) return 'Info page title too long';
      if (ip.description && ip.description.length > MAX_TEXT_LENGTH) return 'Info page description too long';
      if (ip.actionButtons) {
        for (const ab of ip.actionButtons) {
          if (ab.flowSteps && ab.flowSteps.length > 0) {
            for (const step of ab.flowSteps) {
              if (step.options && step.options.length > 10) {
                return 'Flow step cannot have more than 10 options';
              }
            }
          }
        }
      }
      if (ip.extraSteps) {
        for (const step of ip.extraSteps) {
          if (step.options && step.options.length > 10) {
            return 'Extra step cannot have more than 10 options';
          }
        }
      }
    }
  }
  return null;
}

export const saveBuilderRules = [
  body('welcomeMessage').notEmpty().withMessage('Welcome message is required')
    .isLength({ max: MAX_TEXT_LENGTH }).withMessage(`Welcome message too long (max ${MAX_TEXT_LENGTH})`),
  body('buttons').isArray().withMessage('Buttons must be an array'),
  body('buttons').custom((buttons) => {
    const err = validateButtonTree(buttons);
    if (err) throw new Error(err);
    return true;
  }),
];

// ── Staff ──

export const createStaffRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name too long (max 100)'),
  body('role').optional().trim().isLength({ max: 100 }).withMessage('Role too long (max 100)'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Invalid email format'),
  body('telegram_chat_id').optional().trim().isLength({ max: 50 }).withMessage('Telegram chat ID too long'),
];

export const updateStaffRules = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('role').optional().trim().isLength({ max: 100 }).withMessage('Role too long (max 100)'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Invalid email format'),
  body('telegram_chat_id').optional().trim().isLength({ max: 50 }).withMessage('Telegram chat ID too long'),
];

// ── Submissions ──

export const updateStatusRules = [
  body('status').isIn(['new', 'in_progress', 'done', 'cancelled']).withMessage('Invalid status'),
];

// ── Settings ──

export const updateSettingsRules = [
  body('telegramBotToken').optional().trim().isLength({ max: 200 }).withMessage('Bot token too long'),
  body('telegramChatId').optional().trim().isLength({ max: 50 }).withMessage('Chat ID too long'),
  body('businessEmail').optional({ values: 'falsy' }).trim().isEmail().withMessage('Invalid email format'),
  body('whatsappNumber').optional().trim().isLength({ max: 20 }).withMessage('WhatsApp number too long'),
];

// ── Flow Destinations ──

export const addDestinationRules = [
  body('channel').isIn(['email', 'telegram']).withMessage('Channel must be email or telegram'),
  body('staffId').isInt({ min: 1 }).withMessage('Valid staffId required'),
];

export const updateDestinationsRules = [
  body('destinations').isArray().withMessage('destinations must be an array'),
  body('destinations.*.channel').isIn(['email', 'telegram']).withMessage('Channel must be email or telegram'),
  body('destinations.*.staffId').isInt({ min: 1 }).withMessage('Valid staffId required'),
];

// ── Config ──

export const updateConfigRules = [
  body('welcomeMessage').optional().isLength({ max: MAX_TEXT_LENGTH }).withMessage(`Welcome message too long (max ${MAX_TEXT_LENGTH})`),
];

// ── Apply Template ──

export const applyTemplateRules = [
  body('templateKey').notEmpty().withMessage('templateKey is required'),
  body('templateData').isObject().withMessage('templateData must be an object'),
];

// ── Media ──

export const uploadMediaRules = [
  body('fileName').trim().notEmpty().withMessage('fileName is required')
    .isLength({ max: 255 }).withMessage('fileName too long'),
  body('mediaType').isIn(['image', 'video', 'document', 'audio']).withMessage('Invalid media type'),
  body('data').notEmpty().withMessage('data is required'),
];

// ── Param validators ──

export const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
];
