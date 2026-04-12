export const ja = {
  // site
  'site.title': 'まこちゃんガレージ',
  'site.description': '車とバイクの整備記録・ガレージサイト',
  'site.author': 'まこちゃんガレージ',

  // navigation
  'nav.record': 'Record',
  'nav.history': 'History',
  'nav.gallery': 'Gallery',
  'nav.owner': 'Owner',

  // header
  'header.profilePicture': 'プロフィール画像',
  'header.openMenu': 'メニューを開く',
  'header.siteNavigation': 'サイトナビゲーション',

  // footer
  'footer.latestCommit': 'Latest commit:',
  'footer.designSystem': 'Design system:',
  'footer.designSystemLink': 'link',

  // pagination
  'pagination.showing': 'Showing',
  'pagination.to': 'to',
  'pagination.of': 'of',
  'pagination.results': 'results',
  'pagination.pages': 'pages',

  // blog
  'blog.morePosts': 'More posts',
  'blog.backToList': '一覧に戻る',
  'blog.minutes': 'minutes',
  'blog.viewRecord': '整備記録を見る',
  'blog.diyTasks': 'DIY作業内容',
  'blog.toc': 'Table of contents',
  'blog.share': 'Share:',
  'blog.draft': '(draft)',

  // record detail
  'record.detail.invoice': '整備明細書',
  'record.detail.completionDate': '完了日',
  'record.detail.shop': '整備店',
  'record.detail.mileage': '走行距離',
  'record.detail.totalAmount': '合計金額',
  'record.detail.total': '合計',
  'record.detail.diyTasks': 'DIY作業内容',
  'record.detail.classification': '分類',
  'record.detail.workContent': '作業内容',
  'record.detail.amount': '金額',
  'record.detail.backToList': 'の記録一覧に戻る',
  'record.detail.viewBlog': 'ブログ記事を見る',
  'record.detail.metaTitle': '整備明細',
  'record.detail.metaDescSuffix': 'での整備記録',

  // record list
  'record.vehicleInfo': '車両情報',
  'record.totalPrefix': '合計',
  'record.maintenanceRecord': '維持記録',
  'record.noData': 'データなし',

  // record data table columns
  'record.col.completionDate': '完了日',
  'record.col.amount': '金額',
  'record.col.mileage': '走行距離',
  'record.col.shop': '整備店',
  'record.col.maintenanceContent': '整備内容',

  // maintenance categories
  'maintenance.consumable': '主要消耗品交換',
  'maintenance.inspection': '定期点検',
  'maintenance.engine': '機関整備',
  'maintenance.cooling': '冷却系整備',
  'maintenance.braking': '制動系整備',
  'maintenance.suspension': '足回り',
  'maintenance.drivetrain': '駆動系',
  'maintenance.interior': '内外装',
  'maintenance.bodywork': '板金',
  'maintenance.other': 'その他整備',

  // garage
  'garage.jumpToRecord': 'Jump to Record',
  'garage.jumpToHistory': 'Jump to History',

  // gallery
  'gallery.viewArticle': '記事を見る',
  'gallery.thumbnailAlt': 'サムネイル画像',
  'gallery.lightboxAlt': 'ライトボックス画像',

  // page metadata
  'meta.home': 'Home',
  'meta.homeDescription': 'Welcome',
  'meta.blog': 'Blog',
  'meta.tags': 'Tags',
  'meta.tag': 'Tag',
  'meta.categories': 'Categories',
  'meta.category': 'Category',
  'meta.garage': 'Garage',
  'meta.garageDescription': '所有する車とバイクの紹介',
  'meta.links': 'Links',

  // 404
  '404.title': '404 Not Found',
  '404.description': "Sorry, we can't find that page. You'll find lots to explore on the home page.",
  '404.backHome': 'Back to Homepage',

  // language toggle
  'lang.switch': 'EN',
  'lang.label': 'Switch to English',
} as const;

export type TranslationKey = keyof typeof ja;
