#!/usr/bin/env python3
import subprocess, json, time, os, psutil
from datetime import datetime

def load_env():
    env = {}
    with open('/var/www/nabzchat/v2/server/.env') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()
    return env

def send_telegram(bot_token, channel_id, msg):
    try:
        subprocess.run([
            'curl', '-s', '-X', 'POST',
            f'https://api.telegram.org/bot{bot_token}/sendMessage',
            '-d', f'chat_id={channel_id}',
            '-d', 'parse_mode=HTML',
            '-d', f'text={msg}'
        ], capture_output=True, timeout=10)
    except Exception as e:
        print(f'Telegram error: {e}')

def get_pm2_status():
    try:
        r = subprocess.run(['pm2', 'jlist'], capture_output=True, text=True, timeout=10)
        procs = json.loads(r.stdout)
        return {p['name']: p['pm2_env']['status'] for p in procs}
    except:
        return {}

def get_queue_depth():
    try:
        r = subprocess.run([
            'sqlite3', '/var/www/nabzchat/v2/server/data.db',
            'SELECT COUNT(*) FROM message_queue WHERE status="pending";'
        ], capture_output=True, text=True, timeout=5)
        return int(r.stdout.strip() or 0)
    except:
        return -1

def get_error_rate():
    try:
        r = subprocess.run([
            'pm2', 'logs', 'nabzchat', '--lines', '50', '--nostream'
        ], capture_output=True, text=True, timeout=10)
        lines = r.stdout + r.stderr
        errors = sum(1 for l in lines.split('\n') if '"level":50' in l or 'ERROR' in l.upper())
        return errors
    except:
        return 0

def check():
    env = load_env()
    bot = env.get('DEPLOY_BOT_TOKEN', '')
    channel = env.get('DEPLOY_CHANNEL_ID', '')
    alerts = []

    # CPU
    cpu = psutil.cpu_percent(interval=2)
    if cpu > 95:
        alerts.append(('critical', f' CPU critical: {cpu:.0f}%'))
    elif cpu > 80:
        alerts.append(('high', f' CPU high: {cpu:.0f}%'))

    # RAM
    ram = psutil.virtual_memory()
    ram_pct = ram.percent
    if ram_pct > 90:
        alerts.append(('critical', f' RAM critical: {ram_pct:.0f}% ({ram.available // 1024 // 1024}MB free)'))
    elif ram_pct > 85:
        alerts.append(('high', f' RAM high: {ram_pct:.0f}%'))

    # Disk
    disk = psutil.disk_usage('/')
    disk_pct = disk.percent
    if disk_pct > 90:
        alerts.append(('critical', f' Disk critical: {disk_pct:.0f}% used ({disk.free // 1024 // 1024 // 1024}GB free)'))
    elif disk_pct > 80:
        alerts.append(('high', f' Disk high: {disk_pct:.0f}%'))

    # PM2
    pm2 = get_pm2_status()
    for name, status in pm2.items():
        if status != 'online':
            alerts.append(('critical', f' PM2 process DOWN: {name} ({status})'))

    # Queue
    queue = get_queue_depth()
    if queue > 100:
        alerts.append(('high', f' Message queue backed up: {queue} pending'))

    return alerts, cpu, ram_pct, disk_pct, pm2, queue

def main():
    print('NabzChat monitor started')
    last_alerts = {}
    last_daily = None

    while True:
        try:
            now = datetime.now()
            env = load_env()
            bot = env.get('DEPLOY_BOT_TOKEN', '')
            channel = env.get('DEPLOY_CHANNEL_ID', '')

            alerts, cpu, ram, disk, pm2, queue = check()

            # Send alerts with cooldowns
            for severity, msg in alerts:
                cooldown = 300 if severity == 'critical' else 300
                last_time = last_alerts.get(msg, 0)
                if time.time() - last_time > cooldown:
                    send_telegram(bot, channel, msg)
                    last_alerts[msg] = time.time()
                    print(f'ALERT: {msg}')

            # Daily summary at 9am Istanbul (UTC+3)
            istanbul_hour = (now.hour + 3) % 24
            today = now.strftime('%Y-%m-%d')
            if istanbul_hour == 9 and last_daily != today:
                pm2_status = ' '.join([f'{k}:{v}' for k, v in pm2.items()])
                summary = (
                    f' <b>NabzChat Daily Report</b>  {today}\n'
                    f'CPU: {cpu:.0f}% | RAM: {ram:.0f}% | Disk: {disk:.0f}%\n'
                    f'Queue: {queue} pending\n'
                    f'PM2: {pm2_status}'
                )
                send_telegram(bot, channel, summary)
                last_daily = today
                print(f'Daily summary sent')

        except Exception as e:
            print(f'Monitor error: {e}')

        time.sleep(30)

if __name__ == '__main__':
    main()
