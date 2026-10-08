import React from 'react';
import { useTranslation } from 'react-i18next';
import AboutLayout from './AboutLayout';

/**
 * DisclaimerPage — 免责声明页面
 * 包含非医疗声明、科学依据边界、适用人群、结果不保证等条款
 * 符合 App Store / 微信小程序审核要求
 */
export default function DisclaimerPage() {
  const { t } = useTranslation();

  return (
    <AboutLayout titleKey="about.disclaimerTitle">
      <div className="space-y-6" style={{ color: 'var(--color-text-secondary)' }}>
        {/* 生效日期 */}
        <p className="text-xs opacity-60">
          {t('about.effectiveDate')}: 2026-08-20
        </p>

        {/* 一、产品性质声明 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.disclaimer.s1.title')}
          </h2>
          <p className="text-sm leading-relaxed">
            {t('about.disclaimer.s1.content')}
          </p>
        </section>

        {/* 二、科学依据说明 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.disclaimer.s2.title')}
          </h2>
          <p className="text-sm leading-relaxed">
            {t('about.disclaimer.s2.content')}
          </p>
          <ul className="text-sm leading-relaxed mt-2 space-y-1 list-disc pl-4">
            <li>{t('about.disclaimer.s2.li1')}</li>
            <li>{t('about.disclaimer.s2.li2')}</li>
          </ul>
        </section>

        {/* 三、不替代专业建议 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.disclaimer.s3.title')}
          </h2>
          <p className="text-sm leading-relaxed">
            {t('about.disclaimer.s3.content')}
          </p>
        </section>

        {/* 四、结果不保证 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.disclaimer.s4.title')}
          </h2>
          <p className="text-sm leading-relaxed">
            {t('about.disclaimer.s4.content')}
          </p>
        </section>

        {/* 五、适用人群 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.disclaimer.s5.title')}
          </h2>
          <p className="text-sm leading-relaxed">
            {t('about.disclaimer.s5.content')}
          </p>
        </section>

        {/* 六、使用风险自担 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.disclaimer.s6.title')}
          </h2>
          <p className="text-sm leading-relaxed">
            {t('about.disclaimer.s6.content')}
          </p>
        </section>
      </div>
    </AboutLayout>
  );
}
