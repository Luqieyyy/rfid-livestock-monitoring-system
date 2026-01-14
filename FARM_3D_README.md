# 3D Farm Visualization System

## Overview
Complete 3D interactive farm management system with React Three Fiber, providing real-time visualization of kandang (pens) and animals.

## Tech Stack
- **React Three Fiber** (@react-three/fiber v9.5.0) - React renderer for Three.js
- **Drei** (@react-three/drei) - Helper components for R3F (OrbitControls, Text, Sky, Grid)
- **Three.js** (three) - 3D graphics library
- **Zustand** - Lightweight state management
- **Next.js 14** - App Router with TypeScript
- **Firestore** - Real-time database for kandang and animals

## Architecture

### Database Schema

#### `/kandang/{id}`
```typescript
{
  id: string;
  name: string;              // e.g., "Kandang A"
  capacity: number;          // Maximum animals
  position: {                // 3D coordinates on farm
    x: number;
    y: number;
    z: number;
  };
  size: {                    // Physical dimensions (meters)
    width: number;
    height: number;
    depth: number;
  };
  foodSpot: Position3D;      // Location of feeding area
  waterSpot: Position3D;     // Location of water source
  color: string;             // Hex color for visualization
  createdAt: Date;
  updatedAt: Date;
}
```

#### `/animals/{id}`
```typescript
{
  id: string;
  animalId: string;          // Unique identifier (e.g., "C001")
  type: 'cow' | 'goat' | 'sheep';
  breed: string;
  gender: 'male' | 'female';
  weight: number;
  age: number;
  tagNumber: string;
  status: 'healthy' | 'sick' | 'critical';
  kandangId: string;         // Reference to kandang
  position: Position3D;      // 3D position within kandang
  photoUrl?: string;
  lastScan?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### File Structure
```
src/
├── app/admin/farm-overview/
│   └── page.tsx                    # Main farm overview page
├── components/farm/
│   ├── Farm3DScene.tsx             # Canvas and 3D rendering orchestration
│   ├── KandangMesh.tsx             # 3D kandang visualization
│   ├── AnimalMesh.tsx              # 3D animal with drag-and-drop
│   ├── SidebarDetails.tsx          # Selected item details panel
│   ├── KandangCards.tsx            # Grid view of kandang cards
│   ├── KPICards.tsx                # Dashboard metrics
│   └── AddKandangModal.tsx         # Form to create new kandang
├── services/
│   └── farm.service.ts             # Firestore CRUD operations
├── store/
│   └── useFarmStore.ts             # Zustand state management
└── types/
    └── farm.types.ts               # TypeScript interfaces
```

## Features

### 1. 3D Visualization (Farm3DScene.tsx)
- **Interactive Camera**: OrbitControls for navigation (rotate, zoom, pan)
- **Lighting**: Directional light (sun) + ambient light for depth
- **Environment**: Sky gradient, ground grid, fog effect
- **Real-time Rendering**: Renders all kandang and animals in 3D space

### 2. Kandang Mesh (KandangMesh.tsx)
- **Structure**: Box geometry with transparent walls and solid floor
- **Fence Posts**: Cylindrical posts at corners
- **Resource Spots**: Spheres for food (orange) and water (blue) locations
- **Labels**: 3D text showing kandang name
- **Occupancy Indicator**: Color-coded based on capacity (green → yellow → red)
- **Animations**: Hover effect with scale animation
- **Interaction**: Click to select and view details

### 3. Animal Mesh (AnimalMesh.tsx)
- **Type-specific Geometry**:
  - Cows: Box body + cylinder head
  - Goats: Sphere body + cone head
  - Sheep: Sphere body (fluffy appearance)
- **Status Indicators**: Color-coded health status badge above animal
- **Animations**: Idle bobbing animation (up and down motion)
- **Drag-and-Drop**: Click and drag to move animals between kandang
- **Selection Glow**: Emissive effect when selected
- **Hover State**: Blue highlight on mouse over

### 4. State Management (useFarmStore.ts)
- **Zustand Store** with:
  - `kandangs`: Array of all kandang
  - `animals`: Array of all animals
  - `selectedKandang`: Currently selected kandang
  - `selectedAnimal`: Currently selected animal
- **Computed Stats**:
  - `getKandangStats(id)`: Occupancy, health breakdown
  - `calculateFarmStats()`: Total kandang, animals, avg occupancy, at capacity count
- **Real-time Updates**: Automatically recalculates when data changes

### 5. Firestore Service (farm.service.ts)
- **kandangService**:
  - `getAll()`: Fetch all kandang
  - `getById(id)`: Get single kandang
  - `create(data)`: Add new kandang
  - `update(id, data)`: Update kandang
  - `delete(id)`: Remove kandang
- **farmAnimalService**:
  - All CRUD operations
  - `getByKandang(kandangId)`: Filter animals by location
  - `updatePosition(id, position)`: Update 3D coordinates
  - `moveToKandang(animalId, kandangId, position)`: Transfer animal
- **Utilities**:
  - `generateRandomPosition()`: Place animals within kandang bounds
  - `isPositionValid()`: Collision detection
  - `calculateDistance()`: Distance between points
  - Color helpers for status indicators

### 6. UI Components

#### KandangCards.tsx
- Grid display of all kandang
- Shows capacity, occupancy %, health stats
- Progress bar visualization
- Click to select and highlight in 3D

#### KPICards.tsx
- Dashboard metrics:
  - Total Kandang
  - Total Animals
  - Average Occupancy %
  - Kandang At Capacity
- Color-coded badges and trends

#### SidebarDetails.tsx
- Fixed sidebar (right side)
- **Kandang View**:
  - Stats grid (capacity, current, occupancy, available)
  - Health status breakdown
  - 3D position coordinates
  - List of animals with click-to-select
- **Animal View**:
  - Photo display
  - Status badge
  - Details (type, breed, gender, weight, tag, age)
  - Location info
  - Last scan timestamp

#### AddKandangModal.tsx
- Form to create new kandang
- Inputs:
  - Name
  - Capacity
  - Color picker
  - 3D Position (X, Y, Z)
  - Size (Width, Height, Depth)
- Auto-calculates food/water spot positions
- Validation and error handling

## Usage Guide

### Installation
```bash
npm install three @react-three/fiber @react-three/drei zustand --legacy-peer-deps
```

### Running the Application
1. Navigate to Farm Overview: `/admin/farm-overview`
2. The 3D scene will load with all kandang and animals from Firestore
3. Use mouse to navigate:
   - **Left Click + Drag**: Rotate camera
   - **Right Click + Drag**: Pan view
   - **Scroll**: Zoom in/out
   - **Click Kandang/Animal**: Select and view details

### Adding a Kandang
1. Click "Add Kandang" button in header
2. Fill in kandang details:
   - Name (e.g., "Kandang E")
   - Capacity (number of animals)
   - Color (hex code or color picker)
   - Position (X, Z for placement, Y usually 0)
   - Size (width, height, depth in meters)
3. Click "Create Kandang"
4. New kandang appears in 3D scene and grid

### Moving Animals
1. Click on an animal in the 3D scene
2. Drag to new position
3. Release to drop
4. If dropped in different kandang, animal transfers
5. Position saved to Firestore automatically

### Viewing Details
- **Click Kandang**: View occupancy, health stats, animals list
- **Click Animal**: View photo, status, breed, weight, location
- Details appear in right sidebar
- Click anywhere in sidebar to close

## Performance Considerations

### Optimization Techniques
1. **Mesh Instancing**: Future optimization for many animals
2. **Level of Detail (LOD)**: Simplified geometry at distance
3. **Frustum Culling**: Only render visible objects
4. **Lazy Loading**: Load 3D scene after page mount
5. **Debounced Updates**: Limit Firestore writes during drag

### Mobile Support
- Touch controls for orbit
- Simplified geometry on small screens
- Responsive layout with stacked views
- Reduced shadow/lighting effects

## Color Coding System

### Kandang Occupancy
- **Green** (< 70%): Plenty of space available
- **Yellow/Amber** (70-89%): Getting full, monitor closely
- **Red** (90%+): At capacity, action needed

### Animal Health Status
- **Green**: Healthy
- **Yellow/Amber**: Sick, needs treatment
- **Red**: Critical condition, immediate attention

## Future Enhancements
- [ ] Heatmaps for animal clustering
- [ ] Path visualization for animal movement patterns
- [ ] Weather effects (rain, sun intensity)
- [ ] Day/night cycle
- [ ] VR support for immersive viewing
- [ ] Export 3D view as image/video
- [ ] Collision detection between animals
- [ ] Animated feeding/drinking behaviors
- [ ] Sound effects for farm ambiance
- [ ] Multi-farm support with world map

## Troubleshooting

### Common Issues

**Module not found errors:**
```bash
npm install --legacy-peer-deps
```

**TypeScript errors:**
- Restart TypeScript server in VS Code
- Check `tsconfig.json` includes `"jsx": "preserve"`

**3D Scene not rendering:**
- Check browser WebGL support
- Open browser console for errors
- Verify Firestore connection

**Performance issues:**
- Reduce number of animals in scene
- Lower shadow quality
- Disable fog effect
- Use simpler geometries

## API Reference

### Zustand Store Hooks
```typescript
// Get all kandang
const kandangs = useFarmStore((state) => state.kandangs);

// Get selected kandang
const selected = useFarmStore((state) => state.selectedKandang);

// Set kandangs
const setKandangs = useFarmStore((state) => state.setKandangs);

// Get stats for specific kandang
const getStats = useFarmStore((state) => state.getKandangStats);
const stats = getStats('kandang-id');

// Calculate farm-wide stats
const calculate = useFarmStore((state) => state.calculateFarmStats);
const farmStats = calculate();
```

### Service Methods
```typescript
// Fetch all kandang
const kandangs = await kandangService.getAll();

// Create new kandang
const kandangId = await kandangService.create({
  name: 'Kandang E',
  capacity: 50,
  position: { x: 0, y: 0, z: 0 },
  size: { width: 10, height: 3, depth: 10 },
  // ...
});

// Move animal to different kandang
await farmAnimalService.moveToKandang(
  'animal-id',
  'new-kandang-id',
  { x: 2, y: 0, z: 3 }
);
```

## Credits
- **Three.js**: 3D graphics library
- **React Three Fiber**: React renderer for Three.js
- **Drei**: Helper library for common R3F patterns
- **Zustand**: Lightweight state management
- **Next.js**: React framework
- **Firestore**: Real-time database

## License
MIT License - Part of FarmSense Livestock Management System
