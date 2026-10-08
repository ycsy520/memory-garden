/**
 * 全局错误边界 — 保证"永远可玩"原则
 * 捕获React渲染错误，展示友好的降级UI而非白屏
 * v3.3: 接入错误上报封装
 * v4.0: 国际化支持
 */
import React from 'react';
import i18n from '@i18n/index';
import { reportException } from './sentry.client.config';

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
    // 仅在当前版本允许时才执行远程错误上报。
    reportException(error, { extra: { componentStack: info?.componentStack } });
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
            🌱 {i18n.t('errors.gardenProblem')}
          </p>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            {i18n.t('errors.dontWorry')}
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
            {i18n.t('errors.reEnter')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
