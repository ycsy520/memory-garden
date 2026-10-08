import React from 'react';
import { useTranslation } from 'react-i18next';
import AboutLayout from './AboutLayout';

/**
 * PrivacyPage — 隐私政策页面
 * 详细说明数据收集、存储、共享、用户权利等条款
 * 符合 App Store / 微信小程序 / GDPR 等隐私法规要求
 */
export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <AboutLayout titleKey="about.privacyTitle">
      <div className="space-y-6" style={{ color: 'var(--color-text-secondary)' }}>
        <p className="text-xs opacity-60">
          {t('about.effectiveDate')}: 2026-08-20
        </p>

        {/* 一、引言与适用范围 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s1.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.privacy.s1.content')}</p>
        </section>

        {/* 二、我们收集的信息 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s2.title')}
          </h2>
          <h3 className="text-sm font-medium mt-3 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s2.h1')}
          </h3>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-4">
            <li>{t('about.privacy.s2.li1')}</li>
          </ul>
          <h3 className="text-sm font-medium mt-3 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s2.h2')}
          </h3>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-4">
            <li>{t('about.privacy.s2.li2')}</li>
            <li>{t('about.privacy.s2.li3')}</li>
            <li>{t('about.privacy.s2.li4')}</li>
            <li>{t('about.privacy.s2.li5')}</li>
          </ul>
          <h3 className="text-sm font-medium mt-3 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s2.h3')}
          </h3>
          <p className="text-sm leading-relaxed">{t('about.privacy.s2.p1')}</p>
        </section>

        {/* 三、我们如何使用信息 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s3.title')}
          </h2>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-4">
            <li>{t('about.privacy.s3.li1')}</li>
            <li>{t('about.privacy.s3.li2')}</li>
            <li>{t('about.privacy.s3.li3')}</li>
            <li>{t('about.privacy.s3.li4')}</li>
          </ul>
        </section>

        {/* 四、信息的存储与安全 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s4.title')}
          </h2>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-4">
            <li>{t('about.privacy.s4.li1')}</li>
            <li>{t('about.privacy.s4.li2')}</li>
            <li>{t('about.privacy.s4.li3')}</li>
            <li>{t('about.privacy.s4.li4')}</li>
          </ul>
        </section>

        {/* 五、信息的共享与披露 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s5.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.privacy.s5.content')}</p>
          <ul className="text-sm leading-relaxed mt-2 space-y-1 list-disc pl-4">
            <li>{t('about.privacy.s5.li1')}</li>
            <li>{t('about.privacy.s5.li2')}</li>
          </ul>
        </section>

        {/* 六、用户权利 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s6.title')}
          </h2>
          <ul className="text-sm leading-relaxed space-y-1 list-disc pl-4">
            <li>{t('about.privacy.s6.li1')}</li>
            <li>{t('about.privacy.s6.li2')}</li>
            <li>{t('about.privacy.s6.li3')}</li>
            <li>{t('about.privacy.s6.li4')}</li>
          </ul>
        </section>

        {/* 七、儿童隐私保护 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s7.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.privacy.s7.content')}</p>
        </section>

        {/* 八、Cookie 与本地存储 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s8.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.privacy.s8.content')}</p>
        </section>

        {/* 九、隐私政策的更新 */}
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('about.privacy.s9.title')}
          </h2>
          <p className="text-sm leading-relaxed">{t('about.privacy.s9.content')}</p>
        </section>
      </div>
    </AboutLayout>
  );
}
