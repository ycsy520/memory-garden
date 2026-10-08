import React from 'react';
import { useTranslation } from 'react-i18next';
import AboutLayout from './AboutLayout';

/**
 * TermsPage — 使用条款页面
 * 说明服务内容、知识产权、用户行为规范、终止条件等
 * 版权归属个人
 */
export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <AboutLayout titleKey="about.termsTitle">
      <div className="space-y-6" style={{ color: 'var(--color-text-secondary)' }}>
        <p className="text-xs opacity-60">
          {t('about.effectiveDate')}: 2026-08-20
        </p>

        {/* 一、服务说明 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.terms.s1.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.terms.s1.content')}</p>
        </section>

        {/* 二、知识产权 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.terms.s2.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.terms.s2.content')}</p>
          <ul className="text-sm leading-relaxed mt-2 space-y-1 list-disc pl-4">
            <li>{t('about.terms.s2.li1')}</li>
            <li>{t('about.terms.s2.li2')}</li>
          </ul>
        </section>

        {/* 三、用户行为规范 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.terms.s3.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.terms.s3.content')}</p>
          <ul className="text-sm leading-relaxed mt-2 space-y-1 list-disc pl-4">
            <li>{t('about.terms.s3.li1')}</li>
            <li>{t('about.terms.s3.li2')}</li>
            <li>{t('about.terms.s3.li3')}</li>
          </ul>
        </section>

        {/* 四、账户与安全 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.terms.s4.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.terms.s4.content')}</p>
        </section>

        {/* 五、服务变更与终止 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.terms.s5.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.terms.s5.content')}</p>
        </section>

        {/* 六、免责声明 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.terms.s6.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.terms.s6.content')}</p>
        </section>

        {/* 七、管辖法律与争议解决 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.terms.s7.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.terms.s7.content')}</p>
        </section>

        {/* 八、条款更新 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.terms.s8.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.terms.s8.content')}</p>
        </section>

      </div>
    </AboutLayout>
  );
}
