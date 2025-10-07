# CDMO Gap Analysis MongoDB Models

This directory contains MongoDB/Mongoose models for the CDMO (Contract Development and Manufacturing Organization) gap analysis system.

## Models Overview

### Core Entities

1. **Customer** - Client organizations
2. **Project** - CDMO projects associated with customers
3. **Task** - Individual tasks within projects
4. **Milestone** - Project milestones and deliverables
5. **Protocol** - Protocols linked to tasks
6. **Document** - Document storage and management
7. **TagMeta** - Metadata definitions for tags
8. **TagData** - Extracted tag data from documents
9. **Report** - Generated reports

## Relationships

### Customer → Projects → Tasks
- Customers have multiple projects
- Projects have multiple tasks
- Projects belong to customers

### Documents & Tag Data
- Documents belong to projects and customers
- TagData extracts information from documents using TagMeta definitions
- Documents can supersede other documents (version control)

### Protocols & Tasks
- Protocols are linked to specific tasks
- Tasks can have multiple protocols

### Reports
- Reports are generated for specific projects
- Reports track different stages and types

## Usage Examples

```javascript
import { Customer, Project, Task, Document } from '../models/index.js';

// Create a new customer
const customer = new Customer({
  customer_id: 'CUST001',
  name: 'Acme Pharmaceuticals',
  type: 'pharma',
  status: 'active',
  account_manager: 'John Doe'
});

// Find projects with populated customer data
const projects = await Project.find()
  .populate('customer')
  .populate('tasks')
  .populate('documents');

// Get all tasks for a specific project with related data
const tasks = await Task.find({ project_id: 'PROJ001' })
  .populate('project')
  .populate('customer')
  .populate('protocols');
```

## Database Indexes

All models include optimized indexes for:
- Primary keys and foreign key relationships
- Frequently queried fields
- Compound indexes for complex queries

## Virtual Fields

All models include virtual relationships that allow for easy population of related data without storing redundant information.

## Environment Variables

Add to your `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/cdmo-gap-analysis
```

## Setup

1. Install dependencies: `npm install mongoose`
2. Import database connection: `import connectDB from './config/database.js'`
3. Connect to database: `await connectDB()`
4. Import models: `import { Customer, Project } from './models/index.js'`