export default function Guide() {
  return (
    <div className="animate-fade-in max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Guide</h1>
      <p className="text-sm text-gray-500 mb-8">
        Learn how all the pieces of MVPWhatsapp fit together to automate your customer communication.
      </p>

      <div className="space-y-6">
        {/* Overview */}
        <Section icon="🏗️" title="How It Works — Overview" color="emerald">
          <p>MVPWhatsapp automates your WhatsApp customer interactions. Customers message your number, see an interactive menu, browse your services, fill forms, and their requests are automatically assigned to your team.</p>
          <FlowDiagram steps={['Customer sends "Hi"', 'Menu appears', 'They browse or book', 'Form collects info', 'Request created', 'Team notified']} />
        </Section>

        {/* Business Catalog */}
        <Section icon="📋" title="Business Catalog" color="emerald">
          <p>Organize your services as a <strong>tree structure</strong> with categories and subcategories. Customers browse the catalog in WhatsApp, drill into categories, see service details (price, duration), and book directly.</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>• <strong>Categories</strong> — Group related services (e.g. "Hair Services", "Nail Services")</li>
            <li>• <strong>Leaf services</strong> — Individual bookable items with price, duration, and action buttons</li>
            <li>• <strong>Unlimited depth</strong> — Nest categories inside categories as needed</li>
            <li>• <strong>Buttons</strong> — Each service can have "Book Now", "Call", "Open Link", "Back", or "Talk to Agent"</li>
          </ul>
        </Section>

        {/* Menu Editor */}
        <Section icon="📱" title="Menu Editor" color="blue">
          <p>The menu is what customers see first in WhatsApp. It's a tree of <strong>buttons</strong> — each button can open a sub-menu, start a form, show info, trigger an action, or <strong>link to your Business Catalog</strong>.</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>• <strong>Sub-menu (📂)</strong> — Shows more buttons when tapped</li>
            <li>• <strong>Start Form (📝)</strong> — Begins a step-by-step form</li>
            <li>• <strong>Catalog Entry (📋)</strong> — Opens the Business Catalog browser</li>
            <li>• <strong>Info (ℹ️)</strong> — Displays a message</li>
            <li>• <strong>Action (⚡)</strong> — Shows phone, location, or opens a link</li>
          </ul>
          <Tip>Add a "Catalog Entry" button to your menu so customers can browse your services.</Tip>
        </Section>

        {/* Forms */}
        <Section icon="📝" title="Forms (Flows)" color="purple">
          <p>Forms collect structured information from customers step by step. Each step asks one thing — text input, date picker, service selector, etc.</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>• <strong>Step types:</strong> text, number, date, time, service selector, option picker, summary, confirm</li>
            <li>• <strong>Service selector</strong> — Shows your catalog's leaf services for the customer to pick</li>
            <li>• <strong>Summary + Confirm</strong> — Reviews all answers before submitting</li>
          </ul>
          <Tip>Link a form to a menu button or catalog "Book Now" to start collecting customer data.</Tip>
        </Section>

        {/* Customer Requests */}
        <Section icon="📥" title="Customer Requests" color="amber">
          <p>When a customer completes a form, a <strong>Request</strong> is created. Requests are your inbox — view submitted data, change status, and assign to team members.</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>• <strong>Statuses:</strong> Pending → Approved / Rejected / Manual Follow-up → Completed</li>
            <li>• Each request captures all form answers as structured data</li>
          </ul>
        </Section>

        {/* Team & Assignment */}
        <Section icon="👥" title="Team & Auto-Assignment" color="cyan">
          <p><strong>Team Members</strong> are the people who handle requests. <strong>Assignment Rules</strong> automatically route requests to the right person based on service, form, or conditions.</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>• <strong>Round-robin</strong> — Distributes evenly among a team</li>
            <li>• <strong>Service-based</strong> — Routes by which service the customer selected</li>
            <li>• <strong>Manual</strong> — No auto-assign; pick from the requests page</li>
          </ul>
        </Section>

        {/* Live Conversations */}
        <Section icon="💬" title="Live Conversations (Sessions)" color="rose">
          <p>Each WhatsApp phone number has a <strong>session</strong> — tracking where they are in the menu, form, or catalog. You can take over a session for live chat, or release it back to automation.</p>
        </Section>

        {/* WhatsApp Tester */}
        <Section icon="🧪" title="WhatsApp Tester" color="indigo">
          <p>Simulate what a real customer sees <strong>without a WhatsApp account</strong>. Type messages and see exactly how the engine responds — menu, forms, catalog browsing, and more.</p>
          <Tip>Use this to test your entire setup before going live.</Tip>
        </Section>
      </div>
    </div>
  );
}

function Section({ icon, title, color, children }) {
  return (
    <div className={`p-5 rounded-2xl border bg-gradient-to-r from-${color}-50/50 to-white border-${color}-100`}>
      <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span> {title}
      </h2>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}

function Tip({ children }) {
  return (
    <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800">
      <span>💡</span>
      <span>{children}</span>
    </div>
  );
}

function FlowDiagram({ steps }) {
  return (
    <div className="flex items-center gap-1.5 mt-3 flex-wrap text-xs text-gray-600">
      {steps.map((step, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium">{step}</span>
          {i < steps.length - 1 && <span className="text-gray-400">→</span>}
        </span>
      ))}
    </div>
  );
}
