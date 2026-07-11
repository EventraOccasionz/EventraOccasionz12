import { authService } from './authService';
import { bookingService } from './bookingService';
import { galleryService } from './galleryService';
import { adminService } from './adminService';
import { storageService } from './storageService';
import { cmsService } from './cmsService';

export const dataService = {
  // Config state checks
  isConfigured: authService.isConfigured.bind(authService),

  // Auth Operations
  signUp: authService.signUp.bind(authService),
  login: authService.login.bind(authService),
  getAdminWhitelist: authService.getAdminWhitelist.bind(authService),
  signInWithGoogle: authService.signInWithGoogle.bind(authService),
  logout: authService.logout.bind(authService),
  getCurrentUser: authService.getCurrentUser.bind(authService),
  forgotPassword: authService.forgotPassword.bind(authService),

  // Reservation & Inquiry Operations
  getRSVPs: bookingService.getRSVPs.bind(bookingService),
  submitRSVP: bookingService.submitRSVP.bind(bookingService),
  getTransports: bookingService.getTransports.bind(bookingService),
  submitTransport: bookingService.submitTransport.bind(bookingService),
  getRooms: bookingService.getRooms.bind(bookingService),
  setRoomBooking: bookingService.setRoomBooking.bind(bookingService),
  deleteRoomBooking: bookingService.deleteRoomBooking.bind(bookingService),
  getInquiries: bookingService.getInquiries.bind(bookingService),
  addInquiry: bookingService.addInquiry.bind(bookingService),
  updateInquiryStatus: bookingService.updateInquiryStatus.bind(bookingService),
  deleteInquiry: bookingService.deleteInquiry.bind(bookingService),

  // CMS Operations (Categories, Subcategories, Services)
  getCategories: cmsService.getCategories.bind(cmsService),
  addCategory: cmsService.addCategory.bind(cmsService),
  updateCategory: cmsService.updateCategory.bind(cmsService),
  deleteCategory: cmsService.deleteCategory.bind(cmsService),
  duplicateCategory: cmsService.duplicateCategory.bind(cmsService),

  getSubCategories: cmsService.getSubCategories.bind(cmsService),
  addSubCategory: cmsService.addSubCategory.bind(cmsService),
  updateSubCategory: cmsService.updateSubCategory.bind(cmsService),
  deleteSubCategory: cmsService.deleteSubCategory.bind(cmsService),

  getServices: cmsService.getServices.bind(cmsService),
  addService: cmsService.addService.bind(cmsService),
  updateService: cmsService.updateService.bind(cmsService),
  deleteService: cmsService.deleteService.bind(cmsService),

  getMediaLibrary: cmsService.getMediaLibrary.bind(cmsService),
  addMediaItem: cmsService.addMediaItem.bind(cmsService),
  deleteMediaItem: cmsService.deleteMediaItem.bind(cmsService),

  triggerSitemapRebuild: cmsService.triggerSitemapRebuild.bind(cmsService),

  // Legacy Gallery Operations
  getGallery: galleryService.getGallery.bind(galleryService),
  addGalleryItem: galleryService.addGalleryItem.bind(galleryService),
  updateGalleryItem: galleryService.updateGalleryItem.bind(galleryService),
  deleteGalleryItem: galleryService.deleteGalleryItem.bind(galleryService),

  // Whitelists & Audit Logs
  getFamilies: adminService.getFamilies.bind(adminService),
  addFamily: adminService.addFamily.bind(adminService),
  updateFamily: adminService.updateFamily.bind(adminService),
  deleteFamily: adminService.deleteFamily.bind(adminService),
  getFamilyByCode: adminService.getFamilyByCode.bind(adminService),
  getFamilyBySlug: adminService.getFamilyBySlug.bind(adminService),
  getAccounts: adminService.getAccounts.bind(adminService),
  addAccount: adminService.addAccount.bind(adminService),
  updateUserRoleAndPhone: adminService.updateUserRoleAndPhone.bind(adminService),
  getAuditLogs: adminService.getAuditLogs.bind(adminService),
  createAuditLog: adminService.createAuditLog.bind(adminService),
  getVenueSettings: adminService.getVenueSettings.bind(adminService),
  updateVenueSettings: adminService.updateVenueSettings.bind(adminService),
  getAboutSettings: adminService.getAboutSettings.bind(adminService),
  updateAboutSettings: adminService.updateAboutSettings.bind(adminService),

  // File Storage Operations
  uploadImage: storageService.uploadImage.bind(storageService),
  deleteImage: storageService.deleteImage.bind(storageService),

  // Guest Document Operations
  saveGuestDocument: storageService.saveGuestDocument.bind(storageService),
  getGuestDocuments: storageService.getGuestDocuments.bind(storageService),
  updateDocumentStatus: storageService.updateDocumentStatus.bind(storageService),
  deleteGuestDocument: storageService.deleteGuestDocument.bind(storageService)
};
