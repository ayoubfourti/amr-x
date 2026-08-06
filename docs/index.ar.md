# التوثيق التقني لمنصة AMR-X

<div class="docs-intro-layout">
  <div class="docs-intro-copy">
    <span class="docs-intro-status">منصة في مرحلة التطوير الهندسي</span>
    <p>AMR-X منصة روبوت ذاتية ومعيارية تستقبل فيها قاعدة داخلية متنقلة وقابلة لإعادة الاستخدام وحدات وظيفية قابلة للتبديل عبر واجهة إرساء مشتركة. يربط هذا التوثيق بين بنية النظام ومسارات التنفيذ والواجهات وأدلة التحقق.</p>
    <strong class="docs-intro-summary-title">منصة واحدة منسقة بين مختلف التخصصات</strong>
    <ul class="docs-intro-points">
      <li><strong>القاعدة المتنقلة</strong><span>الحركة والاستشعار والحوسبة وطاقة القاعدة وتنسيق السلامة.</span></li>
      <li><strong>واجهة الوحدات المشتركة</strong><span>واجهات محددة للميكانيكا والكهرباء والبيانات والتعريف والحالة.</span></li>
      <li><strong>ROS 2 والتوأم الرقمي</strong><span>الوصف والمحاكاة والخرائط والتموضع وNav2 والاختبارات القابلة للتكرار.</span></li>
      <li><strong>المهام وأدوات المشغّل</strong><span>حالة مهمة مشتركة بين الإشراف عن بُعد والواجهة المحلية.</span></li>
    </ul>
  </div>

<figure class="docs-intro-visual">
  <img src="/docs/assets/images/reference-amr-x-concept-illustration.png" alt="رسم توضيحي لمفهوم منصة AMR-X المعيارية">
  <figcaption>
    <span class="docs-intro-visual__label">مقدمة المفهوم</span>
    <strong>اتجاه المنصة المتنقلة المعيارية</strong>
    <span>صورة مؤقتة لشرح مفهوم AMR-X، وليست هندسة إنتاج نهائية معتمدة.</span>
  </figcaption>
</figure>
</div>

!!! note "بيانات هندسية خاضعة للتحكم"
    تبقى المواصفات الرقمية والمتطلبات وقوائم المواد وقرارات الوحدات في ملفات
    JSON وCSV المعتمدة داخل المستودع. يشرح التوثيق النظام ويربط بهذه المصادر،
    ولا يُعد مصدراً مستقلاً بديلاً عنها.

## خريطة المرجع التقني

| المجال | الغرض | التوثيق |
|---|---|---|
| الوضع الحالي | النطاق الموحّد والأهداف الحالية ومبادئ البنية | [الوضع الحالي للمشروع](project/baseline.md) |
| مسارات العمل الهندسية | حدود المسؤوليات المستقرة والمخرجات المتوقعة | [نظرة عامة](project/workstreams.md) |
| مساحة ROS 2 | الحزم ومستوى النضج والبناء والأوامر وفحص التشغيل | [دليل ROS 2](robotics/ros-workspace.md) |
| التوأم الرقمي | Gazebo والبيئات وجسر ROS والتحقق | [دليل المحاكاة](robotics/simulation.md) |
| الملاحة | SLAM وحفظ الخرائط وNav2 وAMCL | [دليل الملاحة](robotics/navigation.md) |
| واجهات المشغّل | لوحة التحكم وواجهة API وحالة واجهة Qt | [لوحة الويب](interfaces/dashboard.md) · [واجهة Qt/QML](interfaces/qt-hmi.md) |
| الأنظمة المضمنة | حدود العتاد والبرمجيات الثابتة المفقودة ومتطلبات الدمج | [حالة التنفيذ](embedded/implementation.md) |
| إدارة المهام | التحقق والتنفيذ الحتمي والتغذية الراجعة والاستعادة | [بنية إدارة المهام](mission-management/architecture.md) |
| بنية النظام | الحدود الميكانيكية والكهربائية والبرمجية | [نظرة عامة](system_architecture/architecture.md) |
| واجهات النظام | القرارات المعتمدة والمقترحة والمتوقفة | [جدول الواجهات](system_architecture/interfaces.md) |

## نموذج النظام

<div class="system-flow" role="img" aria-label="وحدة وظيفية متصلة بالقاعدة المتنقلة AMR-X عبر واجهة مشتركة">
  <div class="system-flow__node">
    <strong>الوحدة الوظيفية</strong>
    <span>الميكانيكا والاستشعار والتحكم المخصص للمهمة</span>
  </div>
  <div class="system-flow__connector">
    <span>واجهة ميكانيكية · طاقة · بيانات · سلامة</span>
  </div>
  <div class="system-flow__node system-flow__node--base">
    <strong>القاعدة المتنقلة AMR-X</strong>
    <span>الحركة والملاحة وطاقة القاعدة وإدارة الوحدات</span>
  </div>
</div>

## المعاينة المحلية

=== "التوثيق فقط"

    ```bash
    npm run setup:docs
    npm run docs
    ```

    افتح <http://127.0.0.1:8001/>.

=== "الموقع والتوثيق"

    ```bash
    npm run setup
    npm run dev
    ```

    افتح <http://localhost:3000/docs/ar/>.

يحتفظ الوضعان بإعادة التحميل التلقائي لـ MkDocs أثناء تعديل ملفات Markdown.
