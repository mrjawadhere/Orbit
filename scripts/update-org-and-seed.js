import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envText = '';
try {
  envText = fs.readFileSync('.env', 'utf-8');
} catch (e) {
  // ignore
}

const envVars = {};
envText.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envVars[key] = val;
    }
  }
});

const url = envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  console.log("Updating ALL workspaces with Petroleum Software engineering projects & tasks...");

  // Update ALL organizations in DB to Digital Softs
  const { data: orgs, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, created_by');

  if (orgErr) {
    console.error("Error querying orgs:", orgErr.message);
    return;
  }

  for (const org of orgs || []) {
    await supabase.from('organizations').update({ name: 'Digital Softs' }).eq('id', org.id);
    const ownerId = org.created_by;

    // Define petroleum & enterprise projects for this workspace
    const petroProjects = [
      {
        name: 'PetroPulse — Upstream Drilling & Seismic Engine',
        description: 'Real-time offshore drilling telemetry, 3D seismic mesh rendering, wellhead pressure monitoring, and AI predictive maintenance for rigs.',
        color: '#EAB308',
        status: 'active',
        priority: 'urgent',
        progress: 76,
        organization_id: org.id,
        owner_id: ownerId,
        deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      },
      {
        name: 'RefineOps — Refinery Yield Optimization & SCADA',
        description: 'Downstream crude refining process simulator, distillation yield optimizer, tank farm inventory manager, and Modbus/OPC UA sensor hub.',
        color: '#EF4444',
        status: 'active',
        priority: 'high',
        progress: 64,
        organization_id: org.id,
        owner_id: ownerId,
        deadline: new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10),
      },
      {
        name: 'PipelineShield — Pipeline Integrity & Leak Detection',
        description: 'Acoustic leak detection algorithms, IoT pipeline telemetry, GIS pipeline mapping, and cathodic protection monitoring.',
        color: '#10B981',
        status: 'active',
        priority: 'urgent',
        progress: 88,
        organization_id: org.id,
        owner_id: ownerId,
        deadline: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
      },
      {
        name: 'FuelFlow — Distribution Terminal Automation & Fleet ERP',
        description: 'Terminal rack loading automation, temperature volume compensation, dynamic tanker fleet dispatching, and wholesale fuel invoicing.',
        color: '#06B6D4',
        status: 'active',
        priority: 'medium',
        progress: 55,
        organization_id: org.id,
        owner_id: ownerId,
        deadline: new Date(Date.now() + 35 * 86400000).toISOString().slice(0, 10),
      },
    ];

    for (const pSpec of petroProjects) {
      // Check if project exists
      const { data: existingP } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', org.id)
        .eq('name', pSpec.name)
        .maybeSingle();

      let projectId = existingP?.id;

      if (!projectId) {
        // Try finding old project to replace
        const { data: oldP } = await supabase
          .from('projects')
          .select('id')
          .eq('organization_id', org.id)
          .limit(1)
          .maybeSingle();

        if (oldP && !existingP) {
          const { data: updated } = await supabase
            .from('projects')
            .update(pSpec)
            .eq('id', oldP.id)
            .select('id')
            .single();
          projectId = updated?.id;
        } else {
          const { data: created } = await supabase
            .from('projects')
            .insert(pSpec)
            .select('id')
            .single();
          projectId = created?.id;
        }
      } else {
        await supabase.from('projects').update(pSpec).eq('id', projectId);
      }

      if (projectId && ownerId) {
        // Ensure project membership
        await supabase.from('project_members').upsert({
          project_id: projectId,
          user_id: ownerId,
          organization_id: org.id,
        }, { onConflict: 'project_id,user_id' });

        // Add petroleum software tasks for this project
        const tasksForP = {
          'PetroPulse — Upstream Drilling & Seismic Engine': [
            { title: 'SCADA Modbus & OPC UA Telemetry Pipeline', description: 'High-throughput ingestion service for wellhead pressure and flow sensors.', status: 'in_progress', priority: 'urgent', labels: ['petroleum', 'scada', 'iot'], due_offset: 3, est: 16, done: 10 },
            { title: '3D Seismic Mesh Subsurface Renderer', description: 'WebGL/Three.js volumetric rendering engine for seismic survey interpretation.', status: 'in_review', priority: 'high', labels: ['petroleum', 'graphics', 'ai'], due_offset: 5, est: 24, done: 24 },
            { title: 'Predictive Rig Pump Maintenance Classifier', description: 'Train XGBoost model on vibration & thermal telemetry to predict mud pump failures.', status: 'todo', priority: 'high', labels: ['petroleum', 'ai', 'predictive'], due_offset: 12, est: 18, done: 0 },
            { title: 'Offshore Rig Emergency ESD Interlock System', description: 'Fail-safe automated emergency shutdown logic for high-pressure gas blowouts.', status: 'done', priority: 'urgent', labels: ['petroleum', 'safety'], due_offset: -2, est: 20, done: 20 },
          ],
          'RefineOps — Refinery Yield Optimization & SCADA': [
            { title: 'Crude Oil Distillation Heat Exchanger Simulator', description: 'Simulate temperature gradients & thermodynamic equilibrium across fractioning towers.', status: 'in_progress', priority: 'urgent', labels: ['refinery', 'simulation', 'backend'], due_offset: 4, est: 20, done: 12 },
            { title: 'Crude Assay Property Calculator & Blending Engine', description: 'Calculate API gravity, sulfur content, and octane ratings for custom refinery blends.', status: 'todo', priority: 'high', labels: ['refinery', 'algorithm'], due_offset: 8, est: 14, done: 0 },
            { title: 'Tank Farm Real-time Hydrostatic Volume Compensator', description: 'Adjust crude oil storage tank volumes for thermal expansion and API gravity shifts.', status: 'done', priority: 'medium', labels: ['refinery', 'iot'], due_offset: -4, est: 12, done: 12 },
          ],
          'PipelineShield — Pipeline Integrity & Leak Detection': [
            { title: 'Acoustic Pipeline Leak Detection ML Algorithm', description: 'Analyze acoustic sensor waveforms to detect pressure drops and micro-fractures.', status: 'in_progress', priority: 'urgent', labels: ['pipeline', 'ai', 'dsp'], due_offset: 2, est: 22, done: 16 },
            { title: 'GIS Pipeline Asset Telemetry Map Layer', description: 'Overlay live flow rate and cathodic protection voltages on interactive Mapbox GIS map.', status: 'done', priority: 'high', labels: ['gis', 'frontend', 'pipeline'], due_offset: -3, est: 16, done: 16 },
            { title: 'EPA Chemical Emission & Flare Stack Monitor', description: 'Real-time telemetry integration for SO2/VOC flare stack monitoring and EPA compliance.', status: 'todo', priority: 'medium', labels: ['compliance', 'petroleum'], due_offset: 14, est: 10, done: 0 },
          ],
          'FuelFlow — Distribution Terminal Automation & Fleet ERP': [
            { title: 'Wholesale Fuel Loading Gantry API', description: 'Automated authorization and metering for fuel tanker terminal loading racks.', status: 'in_progress', priority: 'high', labels: ['terminal', 'billing', 'api'], due_offset: 6, est: 14, done: 8 },
            { title: 'Tanker Fleet GPS Tracking & Dynamic Dispatching', description: 'Real-time fleet route optimization taking into account hazardous material bridge restrictions.', status: 'todo', priority: 'medium', labels: ['logistics', 'mobile', 'gis'], due_offset: 16, est: 18, done: 0 },
          ],
        }[pSpec.name] || [];

        for (const tSpec of tasksForP) {
          const { data: existingT } = await supabase
            .from('tasks')
            .select('id')
            .eq('organization_id', org.id)
            .eq('title', tSpec.title)
            .maybeSingle();

          if (!existingT) {
            await supabase.from('tasks').insert({
              organization_id: org.id,
              project_id: projectId,
              title: tSpec.title,
              description: tSpec.description,
              status: tSpec.status,
              priority: tSpec.priority,
              assignee_id: ownerId,
              reporter_id: ownerId,
              labels: tSpec.labels,
              due_date: new Date(Date.now() + tSpec.due_offset * 86400000).toISOString().slice(0, 10),
              estimated_hours: tSpec.est,
              completed_hours: tSpec.done,
              completed_at: tSpec.status === 'done' ? new Date().toISOString() : null,
            });
            console.log(`Inserted petroleum task: ${tSpec.title}`);
          }
        }
      }
    }

    // Insert petroleum activity logs
    await supabase.from('activity_logs').insert([
      {
        organization_id: org.id,
        actor_id: ownerId,
        action: 'project.created',
        entity_type: 'project',
        summary: 'Deployed PetroPulse Upstream Drilling & Seismic Engine',
      },
      {
        organization_id: org.id,
        actor_id: ownerId,
        action: 'task.completed',
        entity_type: 'task',
        summary: 'Completed Offshore Rig Emergency ESD Interlock System',
      },
      {
        organization_id: org.id,
        actor_id: ownerId,
        action: 'task.completed',
        entity_type: 'task',
        summary: 'Completed GIS Pipeline Asset Telemetry Map Layer',
      },
    ]);
  }

  console.log("Successfully populated petroleum software projects and tasks!");
}

run().catch(console.error);
