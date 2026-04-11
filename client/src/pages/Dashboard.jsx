import { Typography } from 'antd';

const { Title } = Typography;

export default function Dashboard() {
  return (
    <div>
      <Title level={3}>Dashboard</Title>
      <p>Welcome to MVPWhatsapp. Use the sidebar to navigate.</p>
    </div>
  );
}
