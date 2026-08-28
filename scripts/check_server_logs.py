import pty
import os
import time

def main():
    pid, fd = pty.fork()
    if pid == 0:
        os.execlp('ssh', 'ssh', '-o', 'StrictHostKeyChecking=no', 'root@13.140.187.213')
    else:
        time.sleep(1.5)
        os.write(fd, b"51eJx48hyzZ8\n")
        time.sleep(2)
        
        # Read the prompt
        os.write(fd, b"pm2 logs personal-os --lines 80 --nostream\n")
        time.sleep(3)
        os.write(fd, b"exit\n")
        
        output = b""
        start_time = time.time()
        while time.time() - start_time < 15:
            try:
                chunk = os.read(fd, 4096)
                if not chunk:
                    break
                output += chunk
            except OSError:
                break
        
        print(output.decode('utf-8', errors='ignore'))

if __name__ == '__main__':
    main()
