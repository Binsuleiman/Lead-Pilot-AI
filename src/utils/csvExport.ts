import { Lead } from '../types';

export function exportLeadsToCsv(leads: Lead[], filename = 'leadpilot-leads.csv'): void {
  if (!leads || leads.length === 0) {
    return;
  }

  // Exact comprehensive columns for discovery, research, qualification, and contact enrichment:
  const headers = [
    'Business Name',
    'Category',
    'Address',
    'Phone',
    'Website',
    'Google Maps URL',
    'Research Status',
    'Qualification',
    'Qualification Confidence',
    'Qualification Reason',
    'Contact Enrichment Status',
    'Email',
    'Email Status',
    'Email Confidence',
    'Email Source',
    'Enriched Phone',
    'Contact Page',
    'Decision Maker Name',
    'Decision Maker Role',
    'Decision Maker Source',
    'Social Links',
    'Website Status',
    'AI Business Summary',
    'Outreach Email',
  ];

  const escapeCsv = (val: string | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leads.map((lead) => {
    const socialStr = lead.enrichedSocialLinks && lead.enrichedSocialLinks.length > 0
      ? lead.enrichedSocialLinks.map((s) => `${s.platform}: ${s.url}`).join(' | ')
      : [
          lead.socialLinks.linkedin ? `LinkedIn: ${lead.socialLinks.linkedin}` : null,
          lead.socialLinks.facebook ? `Facebook: ${lead.socialLinks.facebook}` : null,
          lead.socialLinks.twitter ? `Twitter: ${lead.socialLinks.twitter}` : null,
          lead.socialLinks.instagram ? `Instagram: ${lead.socialLinks.instagram}` : null,
        ].filter(Boolean).join(' | ');

    return [
      escapeCsv(lead.businessName),
      escapeCsv(lead.category),
      escapeCsv(lead.address),
      escapeCsv(lead.phone),
      escapeCsv(lead.website ?? 'No website found'),
      escapeCsv(lead.googleMapsUrl),
      escapeCsv(lead.researchStatus || 'Not researched'),
      escapeCsv(lead.qualificationStatus),
      escapeCsv(lead.qualificationConfidence || 'N/A'),
      escapeCsv(lead.qualificationReason),
      escapeCsv(lead.contactEnrichmentStatus || 'Not Enriched'),
      escapeCsv(lead.businessEmail?.value ?? lead.email ?? 'Email not found'),
      escapeCsv(lead.businessEmail?.status ?? (lead.email ? 'Found' : 'Not Found')),
      escapeCsv(lead.businessEmail?.confidence ?? 'N/A'),
      escapeCsv(lead.businessEmail?.source?.title ?? 'N/A'),
      escapeCsv(lead.businessPhone?.value ?? lead.phone ?? 'N/A'),
      escapeCsv(lead.enrichedContactPage?.url ?? lead.contactPage ?? 'N/A'),
      escapeCsv(lead.publicBusinessContact?.name ?? 'N/A'),
      escapeCsv(lead.publicBusinessContact?.role ?? 'N/A'),
      escapeCsv(lead.publicBusinessContact?.source ?? 'N/A'),
      escapeCsv(socialStr || 'None detected'),
      escapeCsv(lead.websiteStatus),
      escapeCsv(lead.businessSummary ?? 'Not researched'),
      escapeCsv(
        lead.outreachEmail
          ? `Subject: ${lead.outreachEmail.subject}\n\n${lead.outreachEmail.body}`
          : 'Outreach not generated'
      ),
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface OutreachExportItem {
  draft: import('../types').OutreachDraft;
  lead?: Lead;
}

export function exportOutreachDraftsToCsv(
  items: OutreachExportItem[],
  filename = 'leadpilot-outreach-drafts.csv'
): void {
  if (!items || items.length === 0) {
    return;
  }

  const headers = [
    'Business Name',
    'Business Email',
    'Business Phone',
    'Website',
    'Qualification Status',
    'Outreach Channel',
    'Objective',
    'Tone',
    'Subject',
    'Message Body',
    'Draft Status',
    'Evidence Used',
    'Source URLs',
    'Suggested Recipient',
    'Created At',
    'Last Updated',
  ];

  const escapeCsv = (val: string | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = items.map(({ draft, lead }) => {
    const businessName = lead?.businessName || draft.leadBusinessName;
    const email = lead?.businessEmail?.value || lead?.email || 'N/A';
    const phone = lead?.businessPhone?.value || lead?.phone || 'N/A';
    const website = lead?.website || 'N/A';
    const qualification = lead?.qualificationStatus || 'N/A';
    const sourcesStr = draft.sourceUrls?.join(' | ') || '';
    const evidenceStr = draft.evidenceUsed?.join(' | ') || '';
    const recipientStr = draft.recipientContact?.value || email || 'N/A';

    return [
      escapeCsv(businessName),
      escapeCsv(email),
      escapeCsv(phone),
      escapeCsv(website),
      escapeCsv(qualification),
      escapeCsv(draft.channel),
      escapeCsv(draft.objective),
      escapeCsv(draft.tone),
      escapeCsv(draft.subject || 'N/A (Direct Message)'),
      escapeCsv(draft.body),
      escapeCsv(draft.status === 'ready' ? 'Ready for Outreach' : draft.status === 'archived' ? 'Archived' : 'Draft'),
      escapeCsv(evidenceStr),
      escapeCsv(sourcesStr),
      escapeCsv(recipientStr),
      escapeCsv(draft.createdAt),
      escapeCsv(draft.updatedAt),
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

