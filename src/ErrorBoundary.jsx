/**
 * 全局错误边界 — 保证"永远可玩"原则
 * 捕获React渲染错误，展示友好的降级UI而非白屏
 * v3.3: 接入 Sentry 错误上报
 */
import React from 'react';
import { captureException } from '@sentry/react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[MemoryGarden] 渲染错误:', error, info);
    // 上报到 Sentry（如果已初始化）
    captureException(error, { extra: { componentStack: info?.componentStack } });
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'var(--font-family-serif)',
            background: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
          }}
        >
          <p style={{ fontSize: 'var(--font-size-xl)', marginBottom: '1rem' }}>
            🌱 花园遇到了一点小问题
          </p>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            别担心，重新进入就好啦
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '1rem 2rem',
              fontSize: 'var(--font-size-base)',
              minWidth: 'var(--touch-min-size)',
              minHeight: 'var(--touch-min-size)',
              background: 'var(--color-brand)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
            }}
          >
            重新进入花园
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
