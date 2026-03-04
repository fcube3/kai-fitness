/**
 * Database cleanup script:
 * 1. Rename duplicate exercise names to canonical versions
 * 2. Remove 0-weight placeholder sets (exercises where all sets are 0kg)
 *
 * Run: npx tsx scripts/cleanup-exercises.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

// Mapping: old name -> canonical name
// Pass 1 (already applied) + Pass 2 (new duplicates found)
const RENAME_MAP: Record<string, string> = {
  // --- Pass 1 (already done, kept for completeness) ---
  'Hack squat': 'Hack Squat',
  'low incline bench': 'Low incline bench',
  'lying leg curl': 'Lying leg curl',
  'Assisted dips': 'Assisted dip',
  'Assisted pull up': 'Assisted pull-up',
  'Calves raise': 'Calf raise',
  'Farmers carry': "Farmer's carry",
  'Lat prayer': 'Lat prayers',
  'Negative pushups': 'Negative push-up',
  'Normal grip pull down': 'Normal grip pulldown',
  'Overhead Tricep extension': 'Overhead tricep extension',
  'Cable Overhead Tricep extension': 'Overhead tricep extension',
  'Pec Dec flye': 'Pec flyes',
  'Pec dec flyes': 'Pec flyes',
  'Machine pec flyes': 'Pec flyes',
  'Slight incline dumbbell press': 'Slight incline db press',
  'Medium grip bench': 'Medium grip bench press',
  'Seated cable chest flye': 'Seated chest flye',
  'One sided delt flyes (machine) seat 4': '1 sided rear delt flye',
  '1 sided rear delt flyes (machine) seat 4': '1 sided rear delt flye',
  'Delt raise': 'Lateral raise',
  'Standing lateral raise': 'Lateral raise',
  // --- Pass 2 (new duplicates surfaced after 0-weight removal) ---
  'lat prayers': 'Lat prayers',
  'Chest supported rows': 'Chest supported row',
  'Facepull cable': 'Cable facepull',
  'Face pull': 'Cable facepull',
  'Cable face pull': 'Cable facepull',
  'Lat pull downs': 'Lat pulldown',
  'Low incline dumbbell': 'Low incline db press',
  'Slight incline dumbbell': 'Slight incline db press',
  'Tricep extension': 'Overhead tricep extension',
  'Overhead extension': 'Overhead tricep extension',
  'Overhead tricep cable': 'Overhead tricep extension',
  'Overhead tricep ext. warmup 15@40kg': 'Overhead tricep extension',
  'One sided delt flyes': '1 sided rear delt flye',
  'Lat raise': 'Lateral raise',
  'Side delt raise': 'Lateral raise',
  'Cable delt raise': 'Cable lateral raise',
  'Cable side delt': 'Cable lateral raise',
  'Cable flyes': 'Seated chest flye',
  'Seated cable flyes': 'Seated chest flye',
  'Flexion row': 'Cable flexion row',
  'Seated dip': 'Dip',
  'Dips': 'Dip',
  'Dumbbell flyes': 'Flat db flyes',
  'Cable machine chest press': 'Seated chest press',
  'Free weight machine chest press': 'Seated chest press',
  'Incline bench press': 'Low incline bench',
  'Incline bicep curl': 'Seated bicep curl',
  'Machine medium grip bench press': 'Medium grip bench press',
  'Medium grip incline bench press': 'Medium grip incline bench',
  'Calves': 'Calf raise',
  'Negative push up': 'Negative push-up',
  'Weighted crunch': 'Weighted crunch',
  // Parse error names -> canonical
  'Lat prayer (Mike) warmup 12@50kg': 'Lat prayers',
  'Lat prayer (machine) warmup 12@30kg': 'Lat prayers',
  'Panatta side delt': 'Panatta Lateral raise',
  'Medium grip barbell': 'Medium grip bench press',
};

async function main() {
  console.log('=== Exercise Cleanup Script ===\n');

  // 1. Rename duplicates
  console.log('--- Step 1: Renaming duplicate exercise names ---');
  let totalRenamed = 0;

  for (const [oldName, newName] of Object.entries(RENAME_MAP)) {
    const { data, error } = await supabase
      .from('fitness_exercises')
      .update({ name: newName })
      .eq('name', oldName)
      .select('id');

    if (error) {
      console.error(`  ERROR renaming "${oldName}" -> "${newName}":`, error.message);
    } else {
      const count = data?.length || 0;
      if (count > 0) {
        console.log(`  ✓ "${oldName}" -> "${newName}" (${count} rows)`);
        totalRenamed += count;
      } else {
        console.log(`  - "${oldName}" -> "${newName}" (no rows found, already clean)`);
      }
    }
  }
  console.log(`\nTotal rows renamed: ${totalRenamed}\n`);

  // Also rename in exercise_goals and exercise_notes tables
  console.log('--- Renaming in exercise_goals and exercise_notes ---');
  for (const [oldName, newName] of Object.entries(RENAME_MAP)) {
    await supabase.from('exercise_goals').update({ exercise_name: newName }).eq('exercise_name', oldName);
    await supabase.from('exercise_notes').update({ exercise_name: newName }).eq('exercise_name', oldName);
  }
  console.log('  Done.\n');

  // 2. Remove 0-weight exercises (placeholders)
  console.log('--- Step 2: Removing 0-weight placeholder exercises ---');

  // Find exercises where weight is 0 or null AND weight_detail is null/empty
  // These are the placeholder "0kg" entries
  const { data: zeroExercises, error: zeroErr } = await supabase
    .from('fitness_exercises')
    .select('id, session_id, name, weight, weight_detail')
    .or('weight.eq.0,weight.is.null')
    .is('weight_detail', null);

  if (zeroErr) {
    console.error('Error finding 0-weight exercises:', zeroErr.message);
  } else if (zeroExercises && zeroExercises.length > 0) {
    // Filter to only those that truly have 0 weight (not ones with weight_detail that has actual values)
    const toDelete = zeroExercises.filter(ex => (ex.weight === 0 || ex.weight === null));
    console.log(`  Found ${toDelete.length} exercises with 0kg weight (placeholders)`);

    // Show what we're deleting
    const byName = new Map<string, number>();
    for (const ex of toDelete) {
      byName.set(ex.name, (byName.get(ex.name) || 0) + 1);
    }
    for (const [name, count] of byName.entries()) {
      console.log(`    - ${name}: ${count} rows`);
    }

    // Delete them
    const ids = toDelete.map(ex => ex.id);
    if (ids.length > 0) {
      const { error: delErr } = await supabase
        .from('fitness_exercises')
        .delete()
        .in('id', ids);

      if (delErr) {
        console.error('  ERROR deleting:', delErr.message);
      } else {
        console.log(`\n  ✓ Deleted ${ids.length} placeholder exercise rows`);
      }
    }
  } else {
    console.log('  No 0-weight exercises found.');
  }

  // 3. Summary
  console.log('\n--- Step 3: Verify unique exercise names ---');
  const { data: allEx } = await supabase
    .from('fitness_exercises')
    .select('name');

  if (allEx) {
    const uniqueNames = [...new Set(allEx.map(e => e.name))].sort();
    console.log(`  ${uniqueNames.length} unique exercises remaining:`);
    for (const name of uniqueNames) {
      console.log(`    - ${name}`);
    }
  }

  console.log('\n=== Cleanup complete ===');
}

main().catch(console.error);
