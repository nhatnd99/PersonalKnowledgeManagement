# KNOWLEDGE_GRAPH_UPGRADE_PLAN.md — Folder-Centric Knowledge Graph Architecture

**Role:** Senior Full Stack Developer, Software Architect, and UI/UX Engineer  
**Project:** PersonalKnowledgeManagement (Knowledge App)  
**Date:** 2026-11-14  

---

## 1. Mục tiêu & Yêu cầu cốt lõi

Nâng cấp Knowledge App theo mô hình **Folder-Centric Knowledge Graph**:
1. **Phân biệt rạch ròi 2 hệ thống quan hệ:**
   - **Hierarchy Relationship (`parentId`):** Xác định cấu trúc cây phân cấp (Folder chứa Subfolder, Folder chứa Note, Note chứa Note con, Note độc lập ở Root). Một node chỉ có tối đa 1 parent.
   - **Semantic Relationship (`NoteRelationship`):** Mối liên kết ngữ nghĩa độc lập (`RELATED_TO`, `REFERENCES`, `DEPENDS_ON`, `EXTENDS`, `CONTRADICTS`). Tạo/xóa/di chuyển node không làm thay đổi hay phá vỡ quan hệ ngữ nghĩa.
2. **Folder-Centric Knowledge Graph:**
   - Khi vào Knowledge Graph, nếu chưa chọn folder: hiển thị giao diện Folder Selector (chọn folder để khám phá).
   - Khi chọn một folder: Folder đó là **Central Node** nổi bật.
   - **Tất cả descendants** thuộc folder (subfolders, direct notes, child notes của notes ở mọi cấp độ lồng nhau) đều xuất hiện trong Graph.
   - Hiển thị hierarchy edges (kết nối parent-child phân cấp) và semantic edges (quan hệ nội dung).
   - Quan hệ kết nối ra ngoài phạm vi folder (external connections): hiển thị external node với visual state phân biệt hoặc qua badges/drawer.
3. **Connections Drawer:**
   - Quản lý đồng thời 2 tab/phần riêng biệt:
     - **Manage Parent:** Hiển thị current parent, breadcrumb path, cho phép chuyển parent sang Folder khác, Note khác, hoặc về Root với validation chống circular hierarchy.
     - **Manage Semantic Relationships:** Danh sách các liên kết ngữ nghĩa hiện tại, thêm quan hệ mới (Note/Folder $\leftrightarrow$ Note/Folder), xóa quan hệ.
4. **Sidebar Hierarchy:**
   - Hỗ trợ đầy đủ Folder đa cấp, Note trong Folder, Note con trong Note cha, Note độc lập tại Root.
   - Thao tác tạo Note thông minh: Từ Folder $\rightarrow$ gán parent là Folder; từ Note $\rightarrow$ tạo Child Note với parent là Note; từ Root $\rightarrow$ tạo Note độc lập (`parentId = null`).

---

## 2. Phân tích hiện trạng & Tái sử dụng Component

| Thành phần | Hiện trạng | Kế hoạch nâng cấp / Tái sử dụng |
|---|---|---|
| **Database Schema** | `Note` (chứa `type: NOTE \| FOLDER`, `parentId`), `NoteRelationship` (nối `sourceNoteId` và `targetNoteId`) | **Không cần migration database**. Mô hình hiện tại đã hỗ trợ Note & Folder trong cùng bảng `notes` với cascade delete và unique constraint. |
| **Backend Graph Service** | `getFolderGraphData` hiện chỉ query direct children của folder | Nâng cấp để query **toàn bộ descendants** theo đúng yêu cầu Section 3.2 ("Tất cả các node trong cấu trúc trên phải xuất hiện trong Graph"), và tạo hierarchy edges giữa mọi cặp parent-child trong cây. |
| **Backend Folder List** | Chưa có endpoint riêng để lấy danh sách folder kèm metadata thống kê | Thêm `GET /api/v1/graph/folders` trả về danh sách folders để phục vụ Folder Selector. |
| **Backend Move Validation** | `moveNote` đã có `assertNoCycle` | Bổ sung rule: Không cho phép gán Note làm parent của Folder (Folder chỉ nhận Folder hoặc null làm parent). |
| **Frontend Graph View** | `KnowledgeGraphView.jsx` dùng React Flow, hiển thị orbit | - Thêm màn hình / dialog **Folder Selector** khi chưa chọn folder.<br>- Layout phân cấp hình tia/cây hoặc radial có Central Folder Node nổi bật ở tâm.<br>- Hiển thị hierarchy edges nối mọi cấp descendants.<br>- Hiển thị external nodes với styling phân biệt. |
| **Connections Drawer** | `RelationshipsPanel.jsx` & `BacklinksPanel.jsx` riêng lẻ | Xây dựng component hợp nhất **`ConnectionsDrawer.jsx`** hiển thị Node Info, Parent Management (tree/dropdown selector + Move API), và Semantic Relationships Management. Tích hợp cả trong NoteEditorView lẫn KnowledgeGraphView. |
| **Sidebar Hierarchy** | `HierarchyTree.jsx`, `TreeNode.jsx`, `Sidebar.jsx` | - Thêm dropdown/nút tạo Note tại Root vs tạo Note trong ngữ cảnh hiện tại.<br>- `TreeNode.jsx` hỗ trợ tạo child note cho cả Note lẫn Folder. |

---

## 3. Danh sách File cần thay đổi & tạo mới

### 3.1 Backend
1. [`backend/src/modules/graph/graph.service.js`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/backend/src/modules/graph/graph.service.js):
   - Nâng cấp `getFolderGraphData` để thu thập đệ quy toàn bộ `descendants` của folder.
   - Thêm `listAllFolders` trả về danh sách folder kèm `childCount`, `noteCount`, `hierarchyPath`.
   - Bổ sung `hierarchyEdges` nối mọi cấp `parentId -> childId` trong scope.
   - Xử lý external semantic edges và external node metadata.
2. [`backend/src/modules/graph/graph.controller.js`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/backend/src/modules/graph/graph.controller.js):
   - Thêm handler `getFoldersListHandler`.
3. [`backend/src/modules/graph/graph.routes.js`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/backend/src/modules/graph/graph.routes.js):
   - Đăng ký `GET /api/v1/graph/folders`.
4. [`backend/src/modules/notes/note.service.js`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/backend/src/modules/notes/note.service.js):
   - Cập nhật `moveNote` kiểm tra: nếu `existingNote.type === 'FOLDER'`, target parent không được là `NOTE`.
5. [`backend/src/modules/graph/graph.test.js`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/backend/src/modules/graph/graph.test.js):
   - Cập nhật test cases cho multi-level descendants và endpoint `GET /api/v1/graph/folders`.

### 3.2 Frontend
1. [`frontend/src/features/knowledge-graph/services/graphService.js`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/frontend/src/features/knowledge-graph/services/graphService.js):
   - Bổ sung `getFoldersList()` gọi `GET /graph/folders`.
2. [`frontend/src/features/knowledge-graph/components/FolderSelector.jsx`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/frontend/src/features/knowledge-graph/components/FolderSelector.jsx) *(Tạo mới)*:
   - Giao diện chọn Folder trực quan (card grid, search input, thống kê note count, hierarchy breadcrumbs).
3. [`frontend/src/features/knowledge-graph/components/KnowledgeGraphView.jsx`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/frontend/src/features/knowledge-graph/components/KnowledgeGraphView.jsx):
   - Nếu truy cập `/graph` mà không có folderId: hiển thị `FolderSelector`.
   - Layout multi-level tree/radial với Central Node to, nổi bật.
   - Tích hợp `ConnectionsDrawer` khi click Connect.
4. [`frontend/src/features/knowledge-graph/components/FolderNode.jsx`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/frontend/src/features/knowledge-graph/components/FolderNode.jsx):
   - Thêm styling cho Central Folder Node (vàng hổ phách glow, viền đậm, badge "Central Node").
   - Hỗ trợ external node styling nếu node nằm ngoài folder scope.
5. [`frontend/src/features/connections/components/ConnectionsDrawer.jsx`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/frontend/src/features/connections/components/ConnectionsDrawer.jsx) *(Tạo mới)*:
   - Hợp nhất:
     - Section 1: Current Node Information (Title, Type, Current parent, Path).
     - Section 2: Manage Parent (Move to Root, Chọn Folder/Note cha, validation chống cycle).
     - Section 3: Semantic Relationships (Danh sách, Xóa, Thêm mới qua Modal).
6. [`frontend/src/features/notes/components/NoteEditorView.jsx`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/frontend/src/features/notes/components/NoteEditorView.jsx):
   - Tích hợp `ConnectionsDrawer` mới thay thế side panel cũ.
7. [`frontend/src/features/hierarchy/components/TreeNode.jsx`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/frontend/src/features/hierarchy/components/TreeNode.jsx):
   - Cho phép tạo child note cho cả Note lẫn Folder.
8. [`frontend/src/components/layout/Sidebar.jsx`](file:///c:/Users/ADMIN/Desktop/Project/PersonalKnowledgeManagement/frontend/src/components/layout/Sidebar.jsx):
   - Nút "New Note" tạo note độc lập ở Root, hoặc có menu tạo nhanh.

---

## 4. Kế hoạch triển khai (Implementation Steps)

- **Bước 1 (Backend):** Cập nhật `graph.service.js`, `graph.controller.js`, `graph.routes.js`, và rule trong `note.service.js`.
- **Bước 2 (Backend Tests):** Cập nhật và chạy `npm test --workspace=backend` đảm bảo 100% tests pass.
- **Bước 3 (Frontend Connections Drawer):** Xây dựng `ConnectionsDrawer.jsx` phân định rõ ràng giữa Hierarchy Parent Management và Semantic Relationships. Tích hợp vào `NoteEditorView.jsx`.
- **Bước 4 (Frontend Knowledge Graph):**
  - Xây dựng `FolderSelector.jsx`.
  - Cập nhật `KnowledgeGraphView.jsx` hiển thị Folder Selector khi chưa chọn folder, và hiển thị multi-level descendants + central node khi đã chọn folder.
- **Bước 5 (Frontend Sidebar & Hierarchy):** Cập nhật `TreeNode.jsx` và `Sidebar.jsx` hỗ trợ Case A, B, C khi tạo note và move note.
- **Bước 6 (Verification & Build):** Kiểm tra lint (`npm run lint`), build (`npm run build`), snapshot thực tế trên trình duyệt headless.
- **Bước 7 (Báo cáo):** Tạo `KNOWLEDGE_GRAPH_UPGRADE_REPORT.md`.
