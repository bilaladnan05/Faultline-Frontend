const SYSTEM_NAMESPACES = new Set([
  "cert-manager",
  "faultline-system",
  "ingress-nginx",
  "istio-system",
  "kube-node-lease",
  "kube-public",
  "kube-system",
  "linkerd",
  "linkerd-viz",
  "monitoring",
]);

const SYSTEM_NAME_PATTERN =
  /^(?:calico|cilium|coredns|etcd|flannel|kube-|metrics-server|node-local-dns|weave-net)/i;

/** Kubernetes infrastructure is identified from normalized resource identity, not message text. */
export function isKubernetesEnvironmentLog(log) {
  const namespace = log.namespace?.toLowerCase();
  if (namespace && (SYSTEM_NAMESPACES.has(namespace) || namespace.startsWith("kube-"))) {
    return true;
  }
  return [log.workload, log.service, log.pod, log.container]
    .filter(Boolean)
    .some((value) => SYSTEM_NAME_PATTERN.test(value));
}

export function applicationIdentity(log) {
  return log.workload ?? log.service ?? log.pod ?? log.container ?? log.namespace ?? "Unidentified application";
}

export function applicationOptions(logs) {
  const counts = new Map();
  for (const log of logs) {
    if (isKubernetesEnvironmentLog(log)) continue;
    const value = applicationIdentity(log);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, count }));
}

export function splitRuntimeTelemetry(logs, selectedApplication) {
  const applicationLogs = [];
  const environmentLogs = [];
  for (const log of logs) {
    if (isKubernetesEnvironmentLog(log)) environmentLogs.push(log);
    else if (!selectedApplication || applicationIdentity(log) === selectedApplication) applicationLogs.push(log);
  }
  return { applicationLogs, environmentLogs };
}

export function matchesRuntimeSearch(item, search) {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return Object.values(item)
    .filter((value) => typeof value === "string" || typeof value === "number")
    .some((value) => String(value).toLowerCase().includes(needle));
}
