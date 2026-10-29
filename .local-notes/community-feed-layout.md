Community feed layout — 2026-10-20

Shared Customer/Staff CommunityScreen: feed composer is one compact row; opens full-screen modal composer.
Back preserves in-memory draft and verified uploads. Publication still uses actual backend/media ownership and stable request keys.
Shared gallery uses one adaptive-aspect tile, two equal tiles, or one large/two small tiles. At most3 visible tiles,
third tile shows +N for hidden assets. Full-screen viewer retains all original assets, supports images and video,
and only creates a video player for the active video. Feed uses video poster thumbnails rather than many players.
Image/video mixed albums follow the same bounded flex layout.
Thread defaults to latest5 loaded comments, reveal10 more at a time; older server pages remain available.
Can fold back to latest5; long comment text can expand/collapse independently, replies/keys unchanged.

Added6 actual existing category PNG files to Pictures/CleanMaster_Test on emulator-5554 and emulator-5556;
media scanner and content-provider query confirm all6 indexed on both. No mock posts or database fixtures added to live app.
Native Staff_Test checked compact row, full-screen compose, real Android Photo Picker, selection of4 images,
3-tile +1 preview and full-screen detail viewer. No publish pressed and no cloud uploads sent.
Customer_Test had stale Expo connection; reconnected exp://10.0.2.2:8090, app now on existing explicit-login screen.
ADB reverse8090 remains on both; Metro8090 and backend8080 healthy. Human login required on Customer_Test.
TypeScript, existing community functional test and Android export passed. No backend changes required.
Cloudinary upload403 permission issue from previous task remains separate; user has not confirmed a corrected key.
