import { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, Drawer, Typography, Dropdown } from 'antd';
import {
  NotificationOutlined,
  TeamOutlined,
  BookOutlined,
  SettingOutlined,
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  CalendarOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = AntLayout;
const { Title } = Typography;

export default function Layout({ 
  mode, 
  onModeChange, 
  isAdmin, 
  onLoginClick, 
  onLogoutClick,
  children 
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 메뉴 아이템 정의
  const getMenuItems = () => {
    const items = [
      {
        key: 'announcement',
        icon: <NotificationOutlined />,
        label: '공지사항',
        onClick: () => {
          onModeChange('announcement');
          if (isMobile) setMobileDrawerOpen(false);
        },
      },
      {
        key: 'volunteer',
        icon: <TeamOutlined />,
        label: '봉사 신청',
        onClick: () => {
          onModeChange('volunteer');
          if (isMobile) setMobileDrawerOpen(false);
        },
      },
      {
        key: 'applicationStatus',
        icon: <CalendarOutlined />,
        label: '봉사 신청 현황',
        onClick: () => {
          onModeChange('applicationStatus');
          if (isMobile) setMobileDrawerOpen(false);
        },
      },
      {
        key: 'universal',
        icon: <BookOutlined />,
        label: '보편',
        onClick: () => {
          onModeChange('universal');
          if (isMobile) setMobileDrawerOpen(false);
        },
      },
    ];

    // 관리자 로그인 시 설정 메뉴 추가
    if (isAdmin) {
      items.push({
        key: 'admin',
        icon: <SettingOutlined />,
        label: '설정',
        onClick: () => {
          onModeChange('admin');
          if (isMobile) setMobileDrawerOpen(false);
        },
      });
    }

    return items;
  };

  // 사용자 메뉴
  const userMenuItems = [
    isAdmin
      ? {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: '로그아웃',
          onClick: onLogoutClick,
        }
      : {
          key: 'login',
          icon: <LoginOutlined />,
          label: '로그인',
          onClick: onLoginClick,
        },
  ];

  // 메뉴 라벨 가져오기
  const getMenuLabel = (key) => {
    const labels = {
      announcement: '공지사항',
      volunteer: '봉사 신청',
       applicationStatus: '봉사 신청 현황',
      universal: '보편',
      admin: '설정',
    };
    return labels[key] || '홈';
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 데스크톱 사이드바 */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <div
            style={{
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: collapsed ? '16px' : '20px',
              fontWeight: 'bold',
              padding: '0 16px',
              transition: 'all 0.2s',
            }}
          >
            {collapsed ? '베텔' : '베텔 봉사'}
          </div>
          <Menu
            theme="dark"
            selectedKeys={[mode]}
            mode="inline"
            items={getMenuItems()}
          />
        </Sider>
      )}

      <AntLayout style={{ marginLeft: isMobile ? 0 : collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        {/* 헤더 */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: '20px' }} />}
                onClick={() => setMobileDrawerOpen(true)}
              />
            )}
            <Title level={4} style={{ margin: 0 }}>
              {isMobile ? '베텔 봉사' : getMenuLabel(mode)}
            </Title>
          </div>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <Button type="text" icon={<UserOutlined />}>
              {!isMobile && (isAdmin ? '관리자' : '로그인')}
            </Button>
          </Dropdown>
        </Header>

        {/* 컨텐츠 */}
        <Content
          style={{
            margin: 0,
            overflow: 'initial',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </AntLayout>

      {/* 모바일 드로어 */}
      {isMobile && (
        <Drawer
          title="베텔 봉사"
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          bodyStyle={{ padding: 0 }}
        >
          <Menu
            mode="inline"
            selectedKeys={[mode]}
            items={getMenuItems()}
            style={{ border: 'none' }}
          />
          <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Button
              type={isAdmin ? 'primary' : 'default'}
              danger={isAdmin}
              block
              icon={isAdmin ? <LogoutOutlined /> : <LoginOutlined />}
              onClick={() => {
                if (isAdmin) {
                  onLogoutClick();
                } else {
                  onLoginClick();
                }
                setMobileDrawerOpen(false);
              }}
            >
              {isAdmin ? '로그아웃' : '로그인'}
            </Button>
          </div>
        </Drawer>
      )}
    </AntLayout>
  );
}

