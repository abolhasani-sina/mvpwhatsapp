import { useState, useEffect } from 'react';
import PhoneMockup from './components/PhoneMockup';
import EditorPanel from './components/EditorPanel';

const API_URL = 'http://localhost:4000';

// ── Helpers to work with nested button tree ──

let nextId = 100;
function genId() { return nextId++; }

function findButton(buttons, id) {
  for (const btn of buttons) {
    if (btn.id === id) return btn;
    if (btn.children) {
      const found = findButton(btn.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateButton(buttons, id, updater) {
  return buttons.map((btn) => {
    if (btn.id === id) return updater(btn);
    if (btn.children) return { ...btn, children: updateButton(btn.children, id, updater) };
    return btn;
  });
}

function getButtonsAtPath(buttons, path) {
  let current = buttons;
  for (const id of path) {
    const parent = current.find((b) => b.id === id);
    if (!parent || !parent.children) return [];
    current = parent.children;
  }
  return current;
}

function setButtonsAtPath(buttons, path, newChildren) {
  if (path.length === 0) return newChildren;
  const parentId = path[0];
  return buttons.map((btn) => {
    if (btn.id === parentId) {
      if (path.length === 1) return { ...btn, children: newChildren };
      return { ...btn, children: setButtonsAtPath(btn.children || [], path.slice(1), newChildren) };
    }
    return btn;
  });
}

// Sync nextId to be above any existing id
function syncNextId(buttons) {
  for (const btn of buttons) {
    if (btn.id >= nextId) nextId = btn.id + 1;
    if (btn.children) syncNextId(btn.children);
  }
}

// Find the path (array of parent IDs) to the level containing a button
function findPathToButton(buttons, targetId, currentPath = []) {
  for (const btn of buttons) {
    if (btn.id === targetId) return currentPath;
    if (btn.children && btn.children.length > 0) {
      const found = findPathToButton(btn.children, targetId, [...currentPath, btn.id]);
      if (found) return found;
    }
  }
  return null;
}

export default function App() {
  const [welcomeMessage, setWelcomeMessage] = useState('👋 Welcome! How can we help you today?');
  const [buttons, setButtons] = useState([
    { id: 1, label: 'Contact us', behavior: null, children: [] },
    { id: 2, label: 'Our Services', behavior: null, children: [] },
    { id: 3, label: 'reserve', behavior: null, children: [] },
  ]);
  const [selectedButtonId, setSelectedButtonId] = useState(null);
  const [path, setPath] = useState([]); // navigation stack of button IDs
  const [viewingInfoId, setViewingInfoId] = useState(null); // info page preview
  const [viewingActionId, setViewingActionId] = useState(null); // action flow preview
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loaded, setLoaded] = useState(false);

  const visibleButtons = getButtonsAtPath(buttons, path);
  const selectedButton = selectedButtonId ? findButton(buttons, selectedButtonId) : null;
  const parentButton = path.length > 0 ? findButton(buttons, path[path.length - 1]) : null;
  const viewingInfoButton = viewingInfoId ? findButton(buttons, viewingInfoId) : null;
  const viewingActionButton = viewingActionId ? findButton(buttons, viewingActionId) : null;

  // Load saved data on mount
  useEffect(() => {
    fetch(`${API_URL}/builder`)
      .then((res) => res.json())
      .then(({ data }) => {
        if (data) {
          setWelcomeMessage(data.welcomeMessage);
          setButtons(data.buttons);
          syncNextId(data.buttons);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function handleSelectButton(id) {
    const newId = id === selectedButtonId ? null : id;
    setSelectedButtonId(newId);
    setSaveStatus(null);
    setErrorMessage('');
    // Auto-show info preview when selecting an info button
    if (newId) {
      const btn = findButton(buttons, newId);
      if (btn && btn.behavior === 'info') {
        setViewingInfoId(newId);
        setViewingActionId(null);
      } else if (btn && btn.behavior === 'action') {
        setViewingActionId(newId);
        setViewingInfoId(null);
      } else {
        setViewingInfoId(null);
        setViewingActionId(null);
      }
    } else {
      setViewingInfoId(null);
      setViewingActionId(null);
    }
  }

  function handleDrillIn(id) {
    const btn = findButton(buttons, id);
    if (!btn) return;
    if (btn.behavior === 'sub_buttons') {
      setPath((prev) => [...prev, id]);
      setSelectedButtonId(null);
      setViewingInfoId(null);
      setSaveStatus(null);
      setErrorMessage('');
    } else if (btn.behavior === 'info') {
      setViewingInfoId(id);
      setViewingActionId(null);
      setSelectedButtonId(null);
      setSaveStatus(null);
      setErrorMessage('');
    } else if (btn.behavior === 'action') {
      setViewingActionId(id);
      setViewingInfoId(null);
      setSelectedButtonId(null);
      setSaveStatus(null);
      setErrorMessage('');
    }
  }

  function handleCloseInfoPreview() {
    setViewingInfoId(null);
  }

  function handleCloseActionPreview() {
    setViewingActionId(null);
  }

  function handleGoBack() {
    setPath((prev) => prev.slice(0, -1));
    setSelectedButtonId(null);
    setSaveStatus(null);
    setErrorMessage('');
  }

  function handleUpdateButton(id, updates) {
    setSaveStatus(null);
    setButtons((prev) => updateButton(prev, id, (b) => ({ ...b, ...updates })));
  }

  function handleReorderButtons(fromIndex, toIndex) {
    setSaveStatus(null);
    const reordered = [...visibleButtons];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    if (path.length === 0) {
      setButtons(reordered);
    } else {
      setButtons((prev) => setButtonsAtPath(prev, path, reordered));
    }
  }

  function handleNavigateTo(target) {
    if (target === 'home') {
      setPath([]);
      setViewingInfoId(null);
      setViewingActionId(null);
      setSelectedButtonId(null);
    } else if (target === 'parent') {
      setViewingInfoId(null);
      setViewingActionId(null);
      handleGoBack();
    } else {
      const targetId = parseInt(target, 10);
      const btn = findButton(buttons, targetId);
      if (!btn) return;
      const pathTo = findPathToButton(buttons, targetId);
      if (pathTo === null) return;
      setViewingInfoId(null);
      setViewingActionId(null);
      setSelectedButtonId(null);
      if (btn.behavior === 'sub_buttons') {
        setPath([...pathTo, targetId]);
      } else if (btn.behavior === 'info') {
        setPath(pathTo);
        setViewingInfoId(targetId);
      } else if (btn.behavior === 'action') {
        setPath(pathTo);
        setViewingActionId(targetId);
      } else {
        setPath(pathTo);
      }
    }
  }

  function handleBehaviorChange(behavior) {
    const btn = findButton(buttons, selectedButtonId);
    if (!btn) return;
    if (btn.children && btn.children.length > 0 && behavior !== 'sub_buttons') {
      setErrorMessage(`"${btn.label}" has sub-options. You need to remove sub-options before changing this button's behavior.`);
      setSaveStatus('error');
      return;
    }
    setErrorMessage('');
    setSaveStatus(null);
    // Auto-show preview when switching behavior
    if (behavior === 'info') {
      setViewingInfoId(selectedButtonId);
      setViewingActionId(null);
    } else if (behavior === 'action') {
      setViewingActionId(selectedButtonId);
      setViewingInfoId(null);
    } else {
      setViewingInfoId(null);
      setViewingActionId(null);
    }
    // Clear children if switching away from sub_buttons (only if empty)
    setButtons((prev) => updateButton(prev, selectedButtonId, (b) => {
      const updated = { ...b, behavior, children: behavior === 'sub_buttons' ? (b.children || []) : [] };
      // Initialize info page data when switching to info
      if (behavior === 'info' && !b.infoPage) {
        updated.infoPage = {
          title: b.label,
          description: '',
          amount: '',
          currency: 'USD',
          duration: '',
          style: 'clean',
          showPrice: true,
          showDuration: true,
          actionButtons: [
            { id: genId(), label: 'Reserve' },
            { id: genId(), label: 'Back' },
          ],
        };
      }
      // Initialize flow steps when switching to action
      if (behavior === 'action' && !b.flowSteps) {
        updated.actionType = 'start_flow';
        updated.flowSteps = [
          { id: genId(), question: '', type: 'text', key: 'step_1', options: [] },
        ];
      }
      return updated;
    }));
  }

  function handleAddChild() {
    if (!selectedButton || selectedButton.behavior !== 'sub_buttons') return;
    const newChild = { id: genId(), label: 'New option', behavior: null, children: [] };
    setButtons((prev) => updateButton(prev, selectedButtonId, (b) => ({
      ...b,
      children: [...(b.children || []), newChild],
    })));
  }

  function handleDeleteButton(id) {
    const btn = findButton(buttons, id);
    if (!btn) return;
    const hasData = (btn.children && btn.children.length > 0) ||
      (btn.flowSteps && btn.flowSteps.length > 0) ||
      btn.infoPage;
    if (hasData) {
      if (!window.confirm('Are you sure you want to delete this button?')) return;
    }
    if (selectedButtonId === id) {
      setSelectedButtonId(null);
      setViewingInfoId(null);
      setViewingActionId(null);
    }
    setSaveStatus(null);
    const removeButton = (btns) => btns.filter((b) => b.id !== id).map((b) => b.children ? { ...b, children: removeButton(b.children) } : b);
    setButtons((prev) => removeButton(prev));
  }

  function handleAddButton() {
    const newBtn = { id: genId(), label: 'New button', behavior: null, children: [] };
    if (path.length === 0) {
      setButtons((prev) => [...prev, newBtn]);
    } else {
      setButtons((prev) => setButtonsAtPath(prev, path, [...visibleButtons, newBtn]));
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus(null);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_URL}/builder/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ welcomeMessage, buttons }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || 'Failed to save');
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
      }
    } catch {
      setErrorMessage('Could not reach server');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Top save bar */}
      <div style={styles.topBar}>
        <span style={styles.topTitle}>V2 WhatsApp Builder</span>
        <div style={styles.topRight}>
          {saveStatus === 'saved' && <span style={styles.savedLabel}>✓ Saved</span>}
          {saveStatus === 'error' && <span style={styles.errorLabel}>{errorMessage}</span>}
          <button
            style={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div style={styles.main}>
        <PhoneMockup
          welcomeMessage={welcomeMessage}
          buttons={visibleButtons}
          selectedButtonId={selectedButtonId}
          onButtonClick={handleSelectButton}
          onButtonDoubleClick={handleDrillIn}
          onAddButton={handleAddButton}
          parentButton={parentButton}
          onGoBack={handleGoBack}
          path={path}
          viewingInfoButton={viewingInfoButton}
          onCloseInfoPreview={handleCloseInfoPreview}
          viewingActionButton={viewingActionButton}
          onCloseActionPreview={handleCloseActionPreview}
          onReorderButtons={handleReorderButtons}
          allButtons={buttons}
          onNavigateTo={handleNavigateTo}
          onDeleteButton={handleDeleteButton}
        />
        <EditorPanel
          welcomeMessage={welcomeMessage}
          onWelcomeChange={(msg) => { setWelcomeMessage(msg); setSaveStatus(null); }}
          selectedButton={selectedButton}
          onBehaviorChange={handleBehaviorChange}
          onBack={() => { setSelectedButtonId(null); setErrorMessage(''); setSaveStatus(null); }}
          errorMessage={saveStatus === 'error' ? errorMessage : ''}
          onAddChild={handleAddChild}
          path={path}
          parentButton={parentButton}
          visibleButtons={visibleButtons}
          onAddButton={handleAddButton}
          onSelectButton={handleSelectButton}
          onUpdateButton={handleUpdateButton}
          genId={genId}
          onReorderButtons={handleReorderButtons}
          allButtons={buttons}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f0f2f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  topBar: {
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111',
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  savedLabel: {
    fontSize: '13px',
    color: '#00a884',
    fontWeight: 500,
  },
  errorLabel: {
    fontSize: '12px',
    color: '#e74c3c',
    maxWidth: '300px',
  },
  saveButton: {
    background: '#00a884',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  main: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '2rem',
    padding: '2rem',
  },
};
