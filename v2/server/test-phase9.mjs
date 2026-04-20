// ═══════════════════════════════════════════════════════════════
// PHASE 9 — UI Polish & Responsiveness: Automated Test Suite
// ═══════════════════════════════════════════════════════════════
// Tests: design tokens, new components, landing sections, login/register,
//        admin panel polish, SEO metadata, responsive patterns
// Run: cd v2/server && node test-phase9.mjs

import assert from 'assert';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT = resolve(__dirname, '..', 'client');

let passed = 0, failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, ok: true });
  } catch (err) {
    failed++;
    results.push({ name, ok: false, error: err.message });
  }
}

function readClient(path) {
  return readFileSync(resolve(CLIENT, path), 'utf-8');
}

console.log('\n══════════════════════════════════════════════');
console.log('  PHASE 9 — UI Polish & Responsiveness Tests');
console.log('══════════════════════════════════════════════\n');

// ────────────────────────────────────────────
// 9.1 — Design Tokens (CSS Custom Properties)
// ────────────────────────────────────────────
console.log('── Test 1: Design Tokens ──');

test('index.css contains CSS custom properties (:root)', () => {
  const css = readClient('src/index.css');
  assert(css.includes(':root'), 'Should have :root block');
  assert(css.includes('--bd-accent'), 'Should have --bd-accent token');
  assert(css.includes('--bd-slate-'), 'Should have slate scale tokens');
  assert(css.includes('--bd-success'), 'Should have success color token');
  assert(css.includes('--bd-error'), 'Should have error color token');
  assert(css.includes('--bd-warning'), 'Should have warning color token');
  assert(css.includes('--bd-teal'), 'Should have teal accent token');
  assert(css.includes('--bd-radius-'), 'Should have radius tokens');
  assert(css.includes('--bd-shadow-'), 'Should have shadow tokens');
});

test('Reduced motion support', () => {
  const css = readClient('src/index.css');
  assert(css.includes('prefers-reduced-motion'), 'Should respect reduced motion preference');
});

test('Skeleton shimmer animation defined', () => {
  const css = readClient('src/index.css');
  assert(css.includes('bd-shimmer'), 'Should define shimmer keyframes');
});

test('Toast animations defined', () => {
  const css = readClient('src/index.css');
  assert(css.includes('bd-toast-in'), 'Should define toast-in animation');
  assert(css.includes('bd-toast-out'), 'Should define toast-out animation');
  assert(css.includes('bd-toast-enter'), 'Should have toast-enter class');
  assert(css.includes('bd-toast-exit'), 'Should have toast-exit class');
});

// ────────────────────────────────────────────
// 9.2 — Toast Component
// ────────────────────────────────────────────
console.log('\n── Test 2: Toast Component ──');

test('Toast.jsx exists and exports ToastProvider + useToast', () => {
  const src = readClient('src/components/Toast.jsx');
  assert(src.includes('export function ToastProvider'), 'Should export ToastProvider');
  assert(src.includes('export function useToast'), 'Should export useToast');
  assert(src.includes('ToastContext'), 'Should use context');
});

test('Toast supports 4 types (success, error, warning, info)', () => {
  const src = readClient('src/components/Toast.jsx');
  // Keys in ICONS/COLORS objects are unquoted identifiers
  assert(src.includes('success:'), 'Should support success type');
  assert(src.includes('error:'), 'Should support error type');
  assert(src.includes('warning:'), 'Should support warning type');
  assert(src.includes('info:'), 'Should support info type');
});

test('Toast has accessible aria-live region', () => {
  const src = readClient('src/components/Toast.jsx');
  assert(src.includes('aria-live'), 'Should have aria-live for screen readers');
});

test('ToastProvider is wired into App.jsx', () => {
  const app = readClient('src/App.jsx');
  assert(app.includes('ToastProvider'), 'App.jsx should import ToastProvider');
  assert(app.includes('<ToastProvider'), 'App.jsx should wrap with ToastProvider');
});

// ────────────────────────────────────────────
// 9.3 — Skeleton Loading Components
// ────────────────────────────────────────────
console.log('\n── Test 3: Skeleton Components ──');

test('Skeleton.jsx exists with Skeleton, SkeletonCard, SkeletonRow, SkeletonTable', () => {
  const src = readClient('src/components/Skeleton.jsx');
  assert(src.includes('export function Skeleton'), 'Should export Skeleton');
  assert(src.includes('export function SkeletonCard'), 'Should export SkeletonCard');
  assert(src.includes('export function SkeletonRow'), 'Should export SkeletonRow');
  assert(src.includes('export function SkeletonTable'), 'Should export SkeletonTable');
});

test('Dashboard uses SkeletonCard for loading state', () => {
  const src = readClient('src/pages/Dashboard.jsx');
  assert(src.includes('SkeletonCard'), 'Dashboard should import SkeletonCard');
  assert(src.includes('<SkeletonCard'), 'Dashboard should render SkeletonCard when loading');
});

// ────────────────────────────────────────────
// 9.4 — Confirm Modal Component
// ────────────────────────────────────────────
console.log('\n── Test 4: Confirm Modal ──');

test('ConfirmModal.jsx exists with proper props', () => {
  const src = readClient('src/components/ConfirmModal.jsx');
  assert(src.includes('export default function ConfirmModal'), 'Should export ConfirmModal');
  assert(src.includes('onConfirm'), 'Should accept onConfirm prop');
  assert(src.includes('onCancel'), 'Should accept onCancel prop');
  assert(src.includes('variant'), 'Should accept variant prop');
});

test('ConfirmModal has accessibility attributes', () => {
  const src = readClient('src/components/ConfirmModal.jsx');
  assert(src.includes('role="dialog"'), 'Should have dialog role');
  assert(src.includes('aria-modal'), 'Should have aria-modal');
});

test('ConfirmModal handles keyboard (Escape)', () => {
  const src = readClient('src/components/ConfirmModal.jsx');
  assert(src.includes('Escape'), 'Should handle Escape key');
});

test('StaffManager uses ConfirmModal instead of window.confirm', () => {
  const src = readClient('src/components/StaffManager.jsx');
  assert(src.includes('ConfirmModal'), 'Should import ConfirmModal');
  assert(src.includes('<ConfirmModal'), 'Should render ConfirmModal');
  assert(!src.includes('window.confirm'), 'Should NOT use window.confirm');
});

// ────────────────────────────────────────────
// 9.5 — Landing Page Polish
// ────────────────────────────────────────────
console.log('\n── Test 5: Landing Page ──');

test('Landing has 6 features', () => {
  const src = readClient('src/pages/Landing.jsx');
  const featureMatches = src.match(/\{ icon:/g);
  assert(featureMatches && featureMatches.length >= 6, `Should have at least 6 features, found ${featureMatches?.length}`);
});

test('Landing has testimonials section', () => {
  const src = readClient('src/pages/Landing.jsx');
  assert(src.includes('TESTIMONIALS'), 'Should have TESTIMONIALS data');
  assert(src.includes('Loved by business owners'), 'Should render testimonials heading');
  assert(src.includes('t.stars'), 'Should render star ratings');
});

test('Landing has pricing section', () => {
  const src = readClient('src/pages/Landing.jsx');
  assert(src.includes('PRICING'), 'Should have PRICING data');
  assert(src.includes('Simple, transparent pricing'), 'Should render pricing heading');
  assert(src.includes('Most Popular'), 'Should highlight a plan');
  assert(src.includes('plan.features'), 'Should list plan features');
});

test('Landing has FAQ accordion', () => {
  const src = readClient('src/pages/Landing.jsx');
  assert(src.includes('FAQ'), 'Should have FAQ data');
  assert(src.includes('openFaq'), 'Should have accordion state');
  assert(src.includes('aria-expanded'), 'FAQ buttons should have aria-expanded');
  assert(src.includes('ChevronDown'), 'Should use ChevronDown icon for accordion');
});

test('Landing hero is mobile responsive', () => {
  const src = readClient('src/pages/Landing.jsx');
  assert(src.includes('text-4xl sm:text-6xl'), 'Hero heading should be responsive');
  assert(src.includes('flex-col sm:flex-row'), 'Hero buttons should stack on mobile');
});

test('Landing features grid is responsive', () => {
  const src = readClient('src/pages/Landing.jsx');
  assert(src.includes('sm:grid-cols-2 lg:grid-cols-3'), 'Features grid should be responsive');
});

// ────────────────────────────────────────────
// 9.6 — Login Page Polish
// ────────────────────────────────────────────
console.log('\n── Test 6: Login Page ──');

test('Login has inline field validation', () => {
  const src = readClient('src/pages/Login.jsx');
  assert(src.includes('fieldErrors'), 'Should have fieldErrors object');
  assert(src.includes('touched'), 'Should track touched state');
  assert(src.includes('onBlur'), 'Should validate on blur');
});

test('Login has email format validation', () => {
  const src = readClient('src/pages/Login.jsx');
  assert(src.includes('Enter a valid email'), 'Should show email format error');
});

test('Login has loading spinner', () => {
  const src = readClient('src/pages/Login.jsx');
  assert(src.includes('Loader2'), 'Should import Loader2 icon');
  assert(src.includes('animate-spin'), 'Should spin while loading');
});

test('Login has styled error box', () => {
  const src = readClient('src/pages/Login.jsx');
  assert(src.includes('bg-red-50'), 'Error should have red background');
  assert(src.includes('border-red-200'), 'Error should have red border');
});

test('Login has terms/privacy text', () => {
  const src = readClient('src/pages/Login.jsx');
  assert(src.includes('Terms of Service'), 'Should mention Terms of Service');
  assert(src.includes('Privacy Policy'), 'Should mention Privacy Policy');
});

// ────────────────────────────────────────────
// 9.7 — Register Page Polish
// ────────────────────────────────────────────
console.log('\n── Test 7: Register Page ──');

test('Register has password strength indicator', () => {
  const src = readClient('src/pages/Register.jsx');
  assert(src.includes('getPasswordStrength'), 'Should have strength function');
  assert(src.includes('Weak'), 'Should show Weak label');
  assert(src.includes('Fair'), 'Should show Fair label');
  assert(src.includes('Good'), 'Should show Good label');
  assert(src.includes('Strong'), 'Should show Strong label');
});

test('Register has inline field validation', () => {
  const src = readClient('src/pages/Register.jsx');
  assert(src.includes('fieldErrors'), 'Should have fieldErrors');
  assert(src.includes('touched'), 'Should track touched state');
  assert(src.includes('Business name is required'), 'Should validate name');
});

test('Register has security reassurance', () => {
  const src = readClient('src/pages/Register.jsx');
  assert(src.includes('ShieldCheck'), 'Should import ShieldCheck icon');
  assert(src.includes('encrypted'), 'Should mention encryption');
});

test('Register is mobile responsive', () => {
  const src = readClient('src/pages/Register.jsx');
  assert(src.includes('px-4 sm:px-8'), 'Form area padding should be responsive');
});

// ────────────────────────────────────────────
// 9.8 — Admin Layout (Mobile Sidebar)
// ────────────────────────────────────────────
console.log('\n── Test 8: Admin Layout Mobile ──');

test('AdminLayout has mobile hamburger menu', () => {
  const src = readClient('src/components/AdminLayout.jsx');
  assert(src.includes('Menu'), 'Should import Menu icon');
  assert(src.includes('mobileOpen'), 'Should have mobileOpen state');
});

test('AdminLayout has mobile overlay', () => {
  const src = readClient('src/components/AdminLayout.jsx');
  assert(src.includes('bg-black/40'), 'Should have backdrop overlay');
  assert(src.includes('lg:hidden'), 'Mobile elements should be hidden on desktop');
});

test('AdminLayout closes mobile sidebar on navigation', () => {
  const src = readClient('src/components/AdminLayout.jsx');
  assert(src.includes('setMobileOpen(false)'), 'Should close on nav');
});

// ────────────────────────────────────────────
// 9.9 — Admin Panel Integration (Toast + Modal)
// ────────────────────────────────────────────
console.log('\n── Test 9: Admin Panel Integration ──');

test('StaffManager uses toast notifications', () => {
  const src = readClient('src/components/StaffManager.jsx');
  assert(src.includes('useToast'), 'Should import useToast');
  assert(src.includes('addToast'), 'Should call addToast');
  assert(src.includes("'Staff member added'"), 'Should show add success toast');
  assert(src.includes("'Staff member removed'"), 'Should show remove success toast');
});

test('SettingsPage uses toast for save feedback', () => {
  const src = readClient('src/pages/SettingsPage.jsx');
  assert(src.includes('useToast'), 'Should import useToast');
  assert(src.includes('addToast'), 'Should call addToast');
  assert(src.includes("'Settings saved successfully'"), 'Should show save success toast');
  assert(src.includes('saving'), 'Should track saving state');
});

test('SettingsPage save button shows loading state', () => {
  const src = readClient('src/pages/SettingsPage.jsx');
  assert(src.includes('disabled={saving}'), 'Save button should disable while saving');
  assert(src.includes("'Saving…'"), 'Should show saving text');
});

// ────────────────────────────────────────────
// 9.10 — SEO Metadata
// ────────────────────────────────────────────
console.log('\n── Test 10: SEO Metadata ──');

test('index.html has proper title', () => {
  const html = readClient('index.html');
  assert(html.includes('BotDesk'), 'Title should contain BotDesk');
  assert(!html.includes('V2 WhatsApp Builder'), 'Should NOT have old placeholder title');
});

test('index.html has meta description', () => {
  const html = readClient('index.html');
  assert(html.includes('meta name="description"'), 'Should have meta description');
});

test('index.html has Open Graph tags', () => {
  const html = readClient('index.html');
  assert(html.includes('og:title'), 'Should have og:title');
  assert(html.includes('og:description'), 'Should have og:description');
  assert(html.includes('og:type'), 'Should have og:type');
});

test('index.html has theme-color', () => {
  const html = readClient('index.html');
  assert(html.includes('theme-color'), 'Should have theme-color meta');
});

test('index.html has favicon', () => {
  const html = readClient('index.html');
  assert(html.includes('rel="icon"'), 'Should have favicon');
});

// ────────────────────────────────────────────
// RESULTS
// ────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════');
console.log('  RESULTS');
console.log('══════════════════════════════════════════════');
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.error ? `: ${r.error}` : ''}`);
}
console.log('──────────────────────────────────────────────');
console.log(`  Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
console.log('══════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
