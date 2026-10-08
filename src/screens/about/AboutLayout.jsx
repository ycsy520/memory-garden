import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/PageHeader';

/**
 * AboutLayout — 法律声明和关于页面的统一布局
 * 包含返回按钮、标题、滚动内容区
 * 遵循现有设计系统（圆角、配色、间距）
 */
export default function AboutLayout({ titleKey, children }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="ui-page-shell animate-fade-in">
      <div className="ui-reading-frame ui-section-stack">
        <header className="ui-reading-header">
          <PageHeader
            onBack={() => navigate(-1)}
            backLabel={t('common.back', '返回')}
            title={t(titleKey)}
            className="w-full"
          />
        </header>

        {/* 内容区：统一阅读正文列宽与卡片层级 */}
        <main className="ui-reading-body p-5 sm:p-7">
          <div className="ui-reading-prose">
            {children}
          </div>

          {/* 统一联系方式区块：所有关于页面底部都放（用户反馈入口） */}
          <section className="mt-10 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div
              className="ui-card-secondary p-4 sm:p-5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {t('about.contactBlock.title')}
              </h2>
              <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t('about.contactBlock.content')}
              </p>
              <p className="text-sm font-mono" style={{ color: 'var(--color-brand)' }}>
                {t('about.contactBlock.email')}
              </p>
            </div>

            {/* 底部版权行 */}
            <p className="mt-5 text-center text-xs opacity-60" style={{ fontFamily: 'var(--font-family-sans)' }}>
              {t('about.copyrightLine')}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
