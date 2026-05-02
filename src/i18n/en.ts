import type { TranslationKey } from './ja';

export const en: Record<TranslationKey, string> = {
  // site
  'site.title': "Mako's Garage",
  'site.description': 'Vehicle maintenance records and garage site',
  'site.author': "Mako's Garage",

  // navigation
  'nav.record': 'Record',
  'nav.blog': 'Blog',
  'nav.gallery': 'Gallery',
  'nav.owner': 'Owner',

  // header
  'header.profilePicture': 'Profile picture',
  'header.openMenu': 'Open main menu',
  'header.siteNavigation': 'Site navigation',

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
  'blog.backToList': 'Back to list',
  'blog.minutes': 'minutes',
  'blog.viewRecord': 'View maintenance record',
  'blog.diyTasks': 'DIY Work',
  'blog.toc': 'Table of contents',
  'blog.share': 'Share:',
  'blog.draft': '(draft)',

  // record detail
  'record.detail.invoice': 'Maintenance Invoice',
  'record.detail.completionDate': 'Completion Date',
  'record.detail.shop': 'Shop',
  'record.detail.mileage': 'Mileage',
  'record.detail.totalAmount': 'Total Amount',
  'record.detail.total': 'Total',
  'record.detail.diyTasks': 'DIY Work',
  'record.detail.classification': 'Category',
  'record.detail.workContent': 'Work Description',
  'record.detail.amount': 'Amount',
  'record.detail.backToList': ' records',
  'record.detail.viewBlog': 'View blog post',
  'record.detail.metaTitle': 'Maintenance Detail',
  'record.detail.metaDescSuffix': ' maintenance record',
  'record.detail.prevRecord': 'Previous Record',
  'record.detail.nextRecord': 'Next Record',
  'record.detail.close': 'Close',

  // record list
  'record.vehicleInfo': 'Vehicle info',
  'record.totalPrefix': 'Total',
  'record.maintenanceRecord': 'Maintenance Record',
  'record.noData': 'No data',

  // record data table columns
  'record.col.completionDate': 'Date',
  'record.col.amount': 'Amount',
  'record.col.mileage': 'Mileage',
  'record.col.shop': 'Shop',
  'record.col.maintenanceContent': 'Maintenance Category',

  // maintenance categories
  'maintenance.consumable': 'Consumable Replacement',
  'maintenance.inspection': 'Periodic Inspection',
  'maintenance.engine': 'Engine Work',
  'maintenance.cooling': 'Cooling System',
  'maintenance.braking': 'Braking System',
  'maintenance.suspension': 'Suspension',
  'maintenance.steering': 'Steering',
  'maintenance.drivetrain': 'Drivetrain',
  'maintenance.interior': 'Interior/Exterior',
  'maintenance.bodywork': 'Body & Paint',
  'maintenance.electrical': 'Electrical',
  'maintenance.other': 'Other Maintenance',

  // garage
  'garage.jumpToRecord': 'Jump to Record',
  'garage.jumpToBlog': 'Jump to Blog',

  // gallery
  'gallery.viewArticle': 'View blog',
  'gallery.thumbnailAlt': 'Thumbnail image',
  'gallery.lightboxAlt': 'Lightbox image',

  // page metadata
  'meta.home': 'Home',
  'meta.homeDescription': 'Welcome',
  'meta.blog': 'Blog',
  'meta.tags': 'Tags',
  'meta.tag': 'Tag',
  'meta.categories': 'Categories',
  'meta.category': 'Category',
  'meta.garage': 'Garage',
  'meta.garageDescription': 'Cars and motorcycles collection',
  'meta.links': 'Links',

  // 404
  '404.title': '404 Not Found',
  '404.description': "Sorry, we can't find that page. You'll find lots to explore on the home page.",
  '404.backHome': 'Back to Homepage',

  // language toggle
  'lang.switch': 'JP',
  'lang.label': '日本語に切り替え',
} as const;
