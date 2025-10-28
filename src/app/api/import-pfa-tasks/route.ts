import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'

/**
 * API Route to import PFA DevOps Lab tasks
 *
 * Call this endpoint once to populate your account with all the PFA tasks:
 * POST http://localhost:3000/api/import-pfa-tasks
 * or
 * GET http://localhost:3000/api/import-pfa-tasks
 */

const tasks = [
  // Section 0: Project setup & repo
  { title: 'Create project repo and folders', description: 'Create repo: pfa-devops-lab with folders: ansible/, docs/, diagrams/, k8s/, docker/, reports/, scripts/. Artifact: README.md (project overview + IP plan)', priority: 'high', position: 1 },
  { title: 'Create issue/board for task tracking', description: 'Create an issue/board in GitLab or task list in Notion for these tasks (this document becomes Issue #0)', priority: 'high', position: 2 },
  { title: 'Commit checklist to docs/checklist.md', description: 'Commit this checklist to docs/checklist.md in the repo', priority: 'medium', position: 3 },

  // Section 1.1: Proxmox & networking basics
  { title: 'Prepare Proxmox host(s)', description: 'Create bridges or VLAN trunking for DMZ, Management, Factory. Artifact: docs/proxmox-networking.md (bridge names, VLAN ids)', priority: 'high', position: 4 },
  { title: 'Define VM sizes and templates', description: 'Define VM sizes and templates (CPU/RAM/disk) for each service. Template images: AlmaLinux/Ubuntu + cloud-init. Artifact: ansible/inventory_example.ini', priority: 'high', position: 5 },

  // Section 1.2: pfSense installation & basic config
  { title: 'Install pfSense', description: 'Install pfSense on VM or physical host', priority: 'high', position: 6 },
  { title: 'Create network interfaces', description: 'Create interfaces: DMZ → 10.0.24.1/24, MGMT → 10.0.28.1/24, FACTORY → 10.0.32.1/24, OVPN → 10.8.0.1/24 (virtual)', priority: 'high', position: 7 },
  { title: 'Configure Unbound resolver & DNS', description: 'Configure Unbound resolver & lab.local DNS zone with A records for services. Artifact: diagrams/dns_records.md', priority: 'high', position: 8 },
  { title: 'Configure NAT/Firewall basics', description: 'Allow VPN port from WAN only. Save pfSense config backup (docs/pfsense-backup.conf). Acceptance: VPN endpoint reachable, interfaces respond to pings', priority: 'high', position: 9 },

  // Section 2: Subnet & firewall rules
  { title: 'Add OpenVPN or WireGuard server', description: 'Setup VPN server with client export. Artifact: docs/vpn_client_instructions.md with client config', priority: 'high', position: 10 },
  { title: 'Implement VPN firewall rules', description: 'Allow VPN → DMZ:443 (HAProxy), VPN → MGMT:22 (Bastion), Block VPN → Factory:22 (direct), Allow pfSense → LDAP', priority: 'high', position: 11 },
  { title: 'Implement DMZ rules', description: 'HAProxy → Factory allowed ports (explicit: 443, 8080, 9000, etc.)', priority: 'high', position: 12 },
  { title: 'Implement MGMT rules', description: 'Bastion → Factory:22 only, LDAP → Factory:389/636 as required', priority: 'high', position: 13 },
  { title: 'Test firewall rules', description: 'Test rules with nmap and telnet from VPN client. Document test outputs in reports/firewall_tests.md', priority: 'medium', position: 14 },

  // Section 3: Core infra: VM deployment & base hardening
  { title: 'Create/clone VMs', description: 'Create VMs: haproxy (DMZ), ldap (MGMT), bastion (MGMT), gitlab, jenkins, sonarqube, rancher, zap, openvas (Factory)', priority: 'high', position: 15 },
  { title: 'Base hardening on all VMs', description: 'Create admin user, disable root SSH, enable fail2ban, enable qemu-guest-agent, install ntp/chrony, configure firewalld/iptables', priority: 'high', position: 16 },
  { title: 'Tag VM snapshots', description: 'Tag snapshots for rollback. Artifact: docs/vm_snapshots.md. Acceptance: All VMs reachable from Bastion via SSH ProxyJump', priority: 'medium', position: 17 },

  // Section 4.1: OpenLDAP
  { title: 'Install slapd and ldap-utils', description: 'Install OpenLDAP packages on 10.0.28.10', priority: 'high', position: 18 },
  { title: 'Configure LDAP structure', description: 'Configure dc=lab,dc=local, ou=People, ou=Groups with base LDIF. Artifact: ansible/roles/ldap/files/base.ldif', priority: 'high', position: 19 },
  { title: 'Configure LDAP TLS', description: 'Configure TLS (LDAPS / StartTLS) and create server cert using pfSense CA', priority: 'high', position: 20 },
  { title: 'Create LDAP users and groups', description: 'Create admin user, readonly bind user, groups (devops, ops), and test users. Acceptance: ldapsearch works', priority: 'high', position: 21 },

  // Section 4.2: Bastion
  { title: 'Configure SSH hardening', description: 'Configure SSH hardening (keys only, PermitRootLogin no, MaxAuthTries 3) on bastion (10.0.28.20)', priority: 'high', position: 22 },
  { title: 'Install & configure SSSD', description: 'Install SSSD to use LDAP (add simple_allow_groups = devops,ops). Artifact: ansible/roles/bastion/templates/sssd.conf.j2', priority: 'high', position: 23 },
  { title: 'Setup session recording', description: 'Setup session recording (tlog or auditd) and fail2ban', priority: 'medium', position: 24 },
  { title: 'Configure MFA (optional)', description: 'Configure MFA with Google Authenticator (optional - document steps)', priority: 'low', position: 25 },
  { title: 'Test bastion login flow', description: 'Test login flow via VPN client. Acceptance: devops users can SSH via LDAP accounts, sessions recorded', priority: 'medium', position: 26 },

  // Section 5: DMZ service — HAProxy
  { title: 'Install HAProxy and TLS cert', description: 'Install HAProxy on 10.0.24.10 and place TLS cert (/etc/haproxy/certs/lab-local-bundle.pem) using pfSense CA', priority: 'high', position: 27 },
  { title: 'Configure HAProxy frontends', description: 'Configure frontends with SNI hostnames: gitlab.lab.local, jenkins.lab.local, sonarqube.lab.local, rancher.lab.local, todo.lab.local', priority: 'high', position: 28 },
  { title: 'Configure HAProxy backends', description: 'Configure backends to factory IPs and health checks. Artifact: ansible/roles/haproxy/templates/haproxy.cfg.j2', priority: 'high', position: 29 },
  { title: 'Test HAProxy routing and TLS', description: 'Test host-based routing and TLS. Acceptance: https://gitlab.lab.local from VPN shows GitLab UI', priority: 'medium', position: 30 },

  // Section 6.1: GitLab
  { title: 'Deploy GitLab', description: 'Deploy GitLab (Omnibus or container) on 10.0.32.11', priority: 'high', position: 31 },
  { title: 'Configure GitLab external URL', description: 'Configure external URL https://gitlab.lab.local', priority: 'high', position: 32 },
  { title: 'Integrate GitLab LDAP auth', description: 'Integrate LDAP for authentication and test login', priority: 'high', position: 33 },
  { title: 'Enable GitLab Container Registry', description: 'Enable Container Registry (Harbor or GitLab registry). Acceptance: User can login via LDAP, push repo, run simple pipeline', priority: 'high', position: 34 },

  // Section 6.2: Jenkins
  { title: 'Deploy Jenkins', description: 'Deploy Jenkins (container or package) on 10.0.32.12', priority: 'high', position: 35 },
  { title: 'Integrate Jenkins LDAP auth', description: 'Integrate LDAP auth plugin for Jenkins', priority: 'high', position: 36 },
  { title: 'Create Jenkins example pipeline', description: 'Create example pipeline job that triggers build and notifies GitLab. Acceptance: Pipeline runs and produces artifact', priority: 'medium', position: 37 },

  // Section 6.3: SonarQube
  { title: 'Deploy SonarQube', description: 'Deploy SonarQube on 10.0.32.13', priority: 'high', position: 38 },
  { title: 'Create SonarQube project and token', description: 'Create project and token; integrate with GitLab CI/Jenkins', priority: 'high', position: 39 },
  { title: 'Run SonarQube analysis for TODO app', description: 'Run analysis for TODO app. Acceptance: Sonar shows analysis results with issues list', priority: 'medium', position: 40 },

  // Section 6.4: Rancher + Kubernetes
  { title: 'Install Rancher server', description: 'Install Rancher server (single-node k3s or RKE2) on 10.0.32.14', priority: 'high', position: 41 },
  { title: 'Create/register Kubernetes cluster', description: 'Create or register a Kubernetes cluster in Rancher', priority: 'high', position: 42 },
  { title: 'Setup K8s ingress', description: 'Setup ingress (ClusterIssuer/IngressClass) to allow HAProxy to reach services', priority: 'high', position: 43 },
  { title: 'Verify container registry access', description: 'Ensure container registry (Harbor or GitLab registry) is accessible. Acceptance: Can deploy workloads via Rancher UI', priority: 'medium', position: 44 },

  // Section 6.5: OWASP ZAP
  { title: 'Deploy OWASP ZAP', description: 'Deploy ZAP as container or service on 10.0.32.20; expose UI internally', priority: 'high', position: 45 },
  { title: 'Test ZAP baseline scan', description: 'Test zap-baseline.py against https://todo.lab.local. Acceptance: ZAP produces HTML report', priority: 'medium', position: 46 },

  // Section 6.6: OpenVAS / GVM
  { title: 'Deploy OpenVAS/GVM', description: 'Deploy OpenVAS (GVM) on 10.0.32.21', priority: 'high', position: 47 },
  { title: 'Configure OpenVAS targets', description: 'Configure credentials and create scanning targets (Factory range, HAProxy)', priority: 'high', position: 48 },
  { title: 'Run initial OpenVAS scan', description: 'Run initial scan and export report. Acceptance: OpenVAS completes scan, can export PDF/HTML', priority: 'medium', position: 49 },

  // Section 7.1: Prepare app for container
  { title: 'Add Dockerfile to app repo', description: 'Add Dockerfile to TODO app repository', priority: 'high', position: 50 },
  { title: 'Add .dockerignore and build scripts', description: 'Add .dockerignore and build scripts to app', priority: 'medium', position: 51 },
  { title: 'Add health endpoint', description: 'Add health endpoint /health for HA checks. Acceptance: Image builds locally and docker run serves app', priority: 'medium', position: 52 },

  // Section 7.2: Push to registry
  { title: 'Create registry project', description: 'Create registry project registry.lab.local/library/mytodo', priority: 'high', position: 53 },
  { title: 'Push image to registry', description: 'Push tagged image from CI/CD or local. Acceptance: Image visible in registry', priority: 'high', position: 54 },

  // Section 7.3: Deploy on Rancher
  { title: 'Create K8s manifests', description: 'Create deployment.yaml and service.yaml or use Rancher UI to deploy', priority: 'high', position: 55 },
  { title: 'Expose service via ingress', description: 'Expose service via ingress with hostname todo.lab.local', priority: 'high', position: 56 },
  { title: 'Configure HAProxy for TODO app', description: 'Configure HAProxy backend to route todo.lab.local to Rancher ingress. Acceptance: https://todo.lab.local accessible from VPN', priority: 'high', position: 57 },

  // Section 8.1: GitLab CI / Jenkins pipelines
  { title: 'Create .gitlab-ci.yml', description: 'Create .gitlab-ci.yml with stages: build, push, deploy, sonar, zap_scan. Artifact: repo/.gitlab-ci.yml', priority: 'high', position: 58 },
  { title: 'Add CI/CD protected variables', description: 'Add protected variables (registry credentials, KUBECONFIG, SONAR_TOKEN)', priority: 'high', position: 59 },
  { title: 'Test CI/CD pipeline', description: 'Test pipeline by pushing a commit. Acceptance: Pipeline finishes end-to-end, ZAP artifact appears', priority: 'medium', position: 60 },

  // Section 8.2: SonarQube integration
  { title: 'Install Sonar Scanner', description: 'Install Sonar Scanner on runner or include in job image', priority: 'high', position: 61 },
  { title: 'Configure sonar-project.properties', description: 'Configure sonar-project.properties in app repo. Acceptance: Sonar project shows analysis results', priority: 'medium', position: 62 },

  // Section 8.3: ZAP in CI
  { title: 'Add ZAP baseline job to CI', description: 'Add ZAP baseline job (use owasp/zap2docker-stable) to run against staging ingress', priority: 'high', position: 63 },
  { title: 'Configure ZAP report artifacts', description: 'Save ZAP report artifacts and fail job on high alerts (optional). Acceptance: ZAP job runs, outputs zap_report.html', priority: 'medium', position: 64 },

  // Section 9.1: Plan & scope
  { title: 'Document pentest scope', description: 'Document authorized scope in docs/pentest_scope.md (IPs, hostnames, exclusions)', priority: 'high', position: 65 },
  { title: 'Schedule scans and get approvals', description: 'Schedule scans and get approvals (for lab, this is simpler)', priority: 'medium', position: 66 },

  // Section 9.2: Automated scans
  { title: 'Run OpenVAS scans', description: 'Run OpenVAS scans on 10.0.24.10 and 10.0.32.0/24. Save reports to reports/openvas/', priority: 'high', position: 67 },
  { title: 'Run ZAP full active scan', description: 'Run ZAP full active scan on https://todo.lab.local. Save reports to reports/zap/', priority: 'high', position: 68 },

  // Section 9.3: Manual checks
  { title: 'Nmap reconnaissance', description: 'Nmap reconnaissance and version enumeration on all targets', priority: 'high', position: 69 },
  { title: 'LDAP security checks', description: 'LDAP checks: anonymous bind, weak creds, cleartext auth', priority: 'high', position: 70 },
  { title: 'Bastion security checks', description: 'Bastion checks: SSH config, MFA, session logs', priority: 'high', position: 71 },
  { title: 'Web application manual testing', description: 'Web manual testing for auth flaws, XSS, SQLi, CSRF, broken access control. Document findings with reproduction steps', priority: 'high', position: 72 },

  // Section 9.4: Report & remediation
  { title: 'Create pentest report', description: 'Create reports/pentest-report.md with summary, high/medium/low issues, remediation steps, evidence', priority: 'high', position: 73 },
  { title: 'Create remediation tickets', description: 'Prioritize fixes and create issues for each remediation (link to GitLab issues). Acceptance: Final PDF/HTML report and ticket list', priority: 'high', position: 74 },

  // Section 10: Backups, certificates & secrets management
  { title: 'Setup internal CA', description: 'Set up internal CA in pfSense and issue certs for hostnames; export CA and import to client trust store', priority: 'high', position: 75 },
  { title: 'Setup LDAP backups', description: 'Backup OpenLDAP LDIF regularly with scripts/backup_ldap.sh, backup GitLab/Jenkins configs', priority: 'high', position: 76 },
  { title: 'Choose secrets management solution', description: 'Decide secrets store: Option A: GitLab protected variables, Option B: HashiCorp Vault (optional)', priority: 'medium', position: 77 },
  { title: 'Document secrets rotation policy', description: 'Document secret rotation policy in docs/secrets_policy.md. Acceptance: Backup scripts tested for restore', priority: 'medium', position: 78 },

  // Section 11: Monitoring & logging
  { title: 'Install monitoring solution', description: 'Install Zabbix/Prometheus + Node exporters or use Rancher monitoring for k8s (optional)', priority: 'medium', position: 79 },
  { title: 'Centralize logs', description: 'Centralize logs (rsyslog/ELK stack optional) — at minimum configure logs retention and tlog/audit on Bastion', priority: 'medium', position: 80 },
  { title: 'Setup service alerts', description: 'Add alerts for critical services down (GitLab/Jenkins/Rancher). Acceptance: Alerts trigger and logs accessible', priority: 'medium', position: 81 },

  // Section 12: Report, demo & final deliverables
  { title: 'Prepare PFA written report', description: 'Prepare PFA written report draft in docs/pfa_report_draft.md', priority: 'high', position: 82 },
  { title: 'Prepare report annexes', description: 'Prepare annexes: configs, LDIFs, ansible roles, haproxy.cfg, sssd.conf, .gitlab-ci.yml, k8s manifests', priority: 'high', position: 83 },
  { title: 'Create demo video', description: 'Create demo video (screen recording): VPN → gitlab.lab.local → trigger pipeline → Sonar & ZAP reports → OpenVAS summary. Save to reports/demo/', priority: 'high', position: 84 },
  { title: 'Finalize pentest report', description: 'Finalize pentest report and remediation plan', priority: 'high', position: 85 },
  { title: 'Prepare presentation slides', description: 'Prepare slide deck (10–15 slides) summarizing objectives, architecture, findings. Acceptance: All deliverables in reports/final_submission.zip', priority: 'high', position: 86 },

  // Section 13: Post-project / cleanup
  { title: 'Rotate temporary credentials', description: 'Rotate any temporary keys & passwords used in lab for demo', priority: 'medium', position: 87 },
  { title: 'Cleanup lab VMs', description: 'Destroy or snapshot lab VMs as required by supervisor', priority: 'low', position: 88 },
  { title: 'Write lessons learned', description: 'Write a short reflection note: what went well, what to improve in docs/lessons_learned.md', priority: 'medium', position: 89 }
]

export async function POST(_request: NextRequest) {
  try {
    // Get the current session
    const session = await getSession()

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to import tasks' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Step 1: Check if project already exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', session.userId)
      .eq('name', 'PFA DevOps Lab')
      .single()

    let projectId: string

    if (existingProject) {
      projectId = existingProject.id
      console.log(`Using existing project: ${projectId}`)
    } else {
      // Step 2: Create the project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: session.userId,
          name: 'PFA DevOps Lab',
          description: 'Projet de Fin d\'Année - Complete DevOps infrastructure lab with pfSense, GitLab, Jenkins, SonarQube, Rancher, security scanning'
        })
        .select()
        .single()

      if (projectError) {
        console.error('Error creating project:', projectError)
        return NextResponse.json(
          { error: 'Failed to create project', details: projectError.message },
          { status: 500 }
        )
      }

      projectId = newProject.id
    }

    // Step 3: Insert all tasks
    const tasksToInsert = tasks.map(task => ({
      user_id: session.userId,
      project_id: projectId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'todo',
      position: task.position
    }))

    const { data: insertedTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select()

    if (tasksError) {
      console.error('Error inserting tasks:', tasksError)
      return NextResponse.json(
        { error: 'Failed to insert tasks', details: tasksError.message },
        { status: 500 }
      )
    }

    // Step 4: Return success response
    return NextResponse.json({
      success: true,
      message: 'Successfully imported all PFA DevOps Lab tasks',
      project: {
        id: projectId,
        name: 'PFA DevOps Lab'
      },
      stats: {
        total: insertedTasks.length,
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      }
    })
  } catch (error) {
    console.error('Error in import-pfa-tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also support GET for easy browser testing
export async function GET(request: NextRequest) {
  return POST(request)
}
