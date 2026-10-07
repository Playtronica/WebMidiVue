#!/usr/bin/env python3
"""Run repeatable software QA with durable JSONL and separate raw output files."""
import argparse, datetime, json, pathlib, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
TESTS = ['test:firmware', 'test:settings-readback', 'test:midi-lifecycle', 'test:diagnostics', 'test:telemetry', 'test:navigation', 'test:compatibility', 'test:listeners', 'test:midi-timing', 'test:sound', 'test:architecture', 'test:legacy-selector', 'test:playtron-variants', 'test:scales-variants', 'test:touchme-variants', 'test:presets', 'test:service-worker-ready', 'test:midi-permission-cancel', 'test:release-evidence', 'test:preview-guard', 'test:sound:levels']
p = argparse.ArgumentParser()
p.add_argument('--output', required=True, type=pathlib.Path)
a = p.parse_args(); a.output.mkdir(parents=True, exist_ok=True)
head = subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
failed = False
with (a.output/'tests.jsonl').open('a') as journal:
 for name in TESTS:
  at = datetime.datetime.now(datetime.timezone.utc).isoformat()
  result = subprocess.run(['npm','run',name],cwd=ROOT,capture_output=True,text=True)
  filename = name.replace(':','-')+'.log'
  (a.output/filename).write_text(result.stdout+result.stderr)
  record = dict(at=at,head=head,test=name,result='PASS' if result.returncode == 0 else 'FAIL',exit_code=result.returncode,evidence=filename)
  journal.write(json.dumps(record)+'\n'); journal.flush()
  print(name, record['result'], flush=True); failed |= result.returncode != 0
sys.exit(1 if failed else 0)
