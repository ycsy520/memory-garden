import React from 'react';
import { useTranslation } from 'react-i18next';
import AboutLayout from './AboutLayout';

/**
 * NbackPage — N-back 科学介绍页面
 * 详细介绍N-back的原理、解决的问题、科学机制和关键文献
 * 基于认知心理学研究成果编写
 */
export default function NbackPage() {
  const { t } = useTranslation();

  return (
    <AboutLayout titleKey="about.nbackTitle">
      <div className="space-y-6" style={{ color: 'var(--color-text-secondary)' }}>

        {/* 一、什么是 N-back 任务？ */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s1.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.nback.s1.p1')}</p>
          <p className="text-sm leading-relaxed mt-2">{t('about.nback.s1.p2')}</p>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s1.h1')}
          </h3>
          <p className="text-sm leading-relaxed">{t('about.nback.s1.p3')}</p>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s1.h2')}
          </h3>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-4">
            <li>{t('about.nback.s1.li1')}</li>
            <li>{t('about.nback.s1.li2')}</li>
          </ul>

          <p className="text-sm leading-relaxed mt-3">{t('about.nback.s1.p4')}</p>
        </section>

        {/* 二、它解决什么问题？ */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s2.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.nback.s2.p1')}</p>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s2.h1')}
          </h3>
          <p className="text-sm leading-relaxed">{t('about.nback.s2.p2')}</p>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s2.h2')}
          </h3>
          <p className="text-sm leading-relaxed">{t('about.nback.s2.p3')}</p>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s2.h3')}
          </h3>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-4">
            <li>{t('about.nback.s2.li1')}</li>
            <li>{t('about.nback.s2.li2')}</li>
            <li>{t('about.nback.s2.li3')}</li>
          </ul>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s2.h4')}
          </h3>
          <p className="text-sm leading-relaxed">{t('about.nback.s2.p4')}</p>
        </section>

        {/* 三、为什么有效？机制与证据 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s3.title')}
          </h2>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s3.h1')}
          </h3>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-4">
            <li>{t('about.nback.s3.li1')}</li>
            <li>{t('about.nback.s3.li2')}</li>
          </ul>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s3.h2')}
          </h3>
          <p className="text-sm leading-relaxed">{t('about.nback.s3.p1')}</p>

          <ul className="text-sm leading-relaxed space-y-2 list-disc pl-4 mt-2">
            <li>{t('about.nback.s3.li3')}</li>
            <li>{t('about.nback.s3.li4')}</li>
            <li>{t('about.nback.s3.li5')}</li>
            <li>{t('about.nback.s3.li6')}</li>
          </ul>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s3.h3')}
          </h3>
          <p className="text-sm leading-relaxed">{t('about.nback.s3.p2')}</p>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s3.h4')}
          </h3>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-4">
            <li>{t('about.nback.s3.li7')}</li>
            <li>{t('about.nback.s3.li8')}</li>
            <li>{t('about.nback.s3.li9')}</li>
          </ul>
        </section>

        {/* 四、关键论文与文献 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s4.title')}
          </h2>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s4.h1')}
          </h3>
          <p className="text-xs leading-relaxed opacity-80">{t('about.nback.s4.ref1')}</p>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s4.h2')}
          </h3>
          <ul className="text-xs leading-relaxed space-y-1 list-disc pl-4 opacity-80">
            <li>{t('about.nback.s4.ref2')}</li>
            <li>{t('about.nback.s4.ref3')}</li>
          </ul>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s4.h3')}
          </h3>
          <ul className="text-xs leading-relaxed space-y-1 list-disc pl-4 opacity-80">
            <li>{t('about.nback.s4.ref4')}</li>
            <li>{t('about.nback.s4.ref5')}</li>
          </ul>

          <h3 className="text-sm font-medium mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.nback.s4.h4')}
          </h3>
          <p className="text-xs leading-relaxed opacity-80">{t('about.nback.s4.p1')}</p>

          {/* 总结 */}
          <div className="ui-card-secondary mt-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {t('about.nback.s4.summary')}
            </p>
          </div>
        </section>
      </div>
    </AboutLayout>
  );
}
