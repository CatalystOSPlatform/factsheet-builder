// CatalystOS Document Templates — system source of truth. Edit templates here; Doc Home, both builders and the Document Templates guide page all read this file.
// Fact sheet section library: content structure only. Styling comes from the document's text styles + Brand Command.
// Block kinds: h (heading), e (eyebrow), p (body), q (quote), kv (label/value table), t (table w/ header),
// chart {chart, rows}, m (metrics [[value,label]]), c (cards [[title,desc]], cols), ppl (people cards w/ photo), img (image placeholder)
const kv = (...labels) => labels.map(l => Array.isArray(l) ? l : [l, 'Enter value']);
const dash = n => Array(n).fill('XX.XX%');

export const CATEGORIES = ['About', 'Strategy', 'Portfolio', 'Performance', 'Fund / Product', 'Impact', 'Marketing', 'Case Study', 'Report', 'Proposal', 'Document'];

export const SECTIONS = {
  'document-header': { cat: 'Document', label: 'Document Header', desc: 'Fund or strategy name, subtitle and reporting period.', blocks: [
    { k: 'e', text: 'Q1 2026 · FACT SHEET' }, { k: 'h1', text: 'Strategy or Fund Name' }, { k: 'p', text: 'Subtitle or tagline — Enter description' }] },
  'firm-overview': { cat: 'About', label: 'Firm Overview', desc: 'Short narrative about the firm or sponsor.', blocks: [
    { k: 'h', text: 'Firm Overview' }, { k: 'p', text: 'Company Name is an investment firm founded in 20XX. Enter description of specialization, investment philosophy, ownership and client focus.' }] },
  'firm-facts': { cat: 'About', label: 'Firm Facts', desc: 'Label–value facts: founded, HQ, ownership, AUM.', blocks: [
    { k: 'h', text: 'Firm Facts' }, { k: 'kv', rows: kv(['Founded', '20XX'], ['Headquarters', 'City, State'], 'Ownership', ['Firm AUM', '$X.XB'], ['Strategy AUM', '$XXXM'], ['Employees', 'XX']) }] },
  'differentiators': { cat: 'About', label: 'Why Us', desc: 'Three differentiators with short descriptions.', blocks: [
    { k: 'h', text: 'Why Us' }, { k: 'c', cols: 3, items: [['Differentiator', 'Enter description'], ['Differentiator', 'Enter description'], ['Differentiator', 'Enter description']] }] },
  'timeline': { cat: 'About', label: 'Timeline / History', desc: 'Milestones by year.', blocks: [
    { k: 'h', text: 'History' }, { k: 'c', cols: 4, items: [['20XX', 'Milestone — Enter description'], ['20XX', 'Milestone — Enter description'], ['20XX', 'Milestone — Enter description'], ['20XX', 'Milestone — Enter description']] }] },
  'team': { cat: 'About', label: 'Leadership / Team', desc: 'People with photo, name, title and bio.', blocks: [
    { k: 'h', text: 'Investment Team' }, { k: 'ppl', cols: 3, items: [['Name, CFA', 'Title · XX years experience'], ['Name, CFA', 'Title · XX years experience'], ['Name, CFA', 'Title · XX years experience']] }] },
  'featured-person': { cat: 'About', label: 'Featured Person', desc: 'One person with a larger photo and biography.', blocks: [
    { k: 'img', w: .38, h: 1.1, side: true }, { k: 'h', text: 'Name, Credentials' }, { k: 'e', text: 'TITLE' }, { k: 'p', text: 'Enter biography.' }] },
  'strategy-overview': { cat: 'Strategy', label: 'Strategy Overview', desc: 'Narrative plus supporting strategy details.', blocks: [
    { k: 'h', text: 'Strategy Overview' }, { k: 'p', text: 'Enter description of the investment strategy.' },
    { k: 'kv', rows: kv('Asset Class', 'Investment Style', ['Inception', 'MM/DD/YYYY'], ['Benchmark', 'Benchmark'], ['Strategy Assets', '$XXXM']) }] },
  'strategy-highlights': { cat: 'Strategy', label: 'Strategy Highlights', desc: 'Compact label–value summary.', blocks: [
    { k: 'h', text: 'Strategy Highlights' }, { k: 'kv', rows: kv('Objective', 'Asset Class', 'Investment Style', ['Inception', 'MM/DD/YYYY'], ['Benchmark', 'Benchmark'], ['AUM', '$X.XB']) }] },
  'investment-objective': { cat: 'Strategy', label: 'Investment Objective', desc: 'One concise objective statement.', blocks: [
    { k: 'h', text: 'Investment Objective' }, { k: 'q', text: 'The strategy seeks to Enter description.' }] },
  'investment-approach': { cat: 'Strategy', label: 'Investment Approach', desc: 'Process steps: research, selection, risk.', blocks: [
    { k: 'h', text: 'Investment Approach' }, { k: 'p', text: 'Enter introduction.' },
    { k: 'c', cols: 2, items: [['01 · Approach', 'Enter description'], ['02 · Approach', 'Enter description']] }] },
  'themes': { cat: 'Strategy', label: 'Themes / Areas of Focus', desc: 'Investment themes or target sectors.', blocks: [
    { k: 'h', text: 'Investment Themes' }, { k: 'c', cols: 3, items: [['Theme', 'Enter description'], ['Theme', 'Enter description'], ['Theme', 'Enter description']] }] },
  'geography': { cat: 'Strategy', label: 'Where We Invest', desc: 'Markets with image and description.', blocks: [
    { k: 'h', text: 'Where We Invest' }, { k: 'ppl', cols: 3, items: [['Market Name', 'Enter description'], ['Market Name', 'Enter description'], ['Market Name', 'Enter description']] }] },
  'allocation': { cat: 'Portfolio', label: 'Allocation', desc: 'Sector, geographic or asset allocation chart.', blocks: [
    { k: 'h', text: 'Allocation' }, { k: 'e', text: 'AS OF MM/DD/YYYY' },
    { k: 'chart', chart: 'donut', rows: [['Category', 'Weight'], ['Category A', '0'], ['Category B', '0'], ['Category C', '0']] }] },
  'portfolio-characteristics': { cat: 'Portfolio', label: 'Portfolio Characteristics', desc: 'Portfolio vs. benchmark statistics.', blocks: [
    { k: 'h', text: 'Portfolio Characteristics' }, { k: 't', rows: [['', 'Strategy', 'Benchmark'], ['Number of Holdings', 'XX', 'XX'], ['Market Capitalization', '$X.XB', '$X.XB'], ['P/E Ratio', 'X.XXx', 'X.XXx'], ['Dividend Yield', 'XX.XX%', 'XX.XX%'], ['Active Share', 'XX.XX%', '—']] }] },
  'holdings': { cat: 'Portfolio', label: 'Top Holdings', desc: 'Holdings with portfolio weight.', blocks: [
    { k: 'h', text: 'Top 10 Holdings' }, { k: 'e', text: 'AS OF MM/DD/YYYY' }, { k: 't', rows: [['Holding', 'Weight'], ...Array.from({ length: 10 }, () => ['Company Name', 'XX.XX%'])] }] },
  'contributors': { cat: 'Portfolio', label: 'Contributors / Detractors', desc: 'Securities driving performance.', blocks: [
    { k: 'h', text: 'Top Contributors' }, { k: 't', rows: [['Name', 'Return', 'Contribution'], ['Company Name', 'XX.XX%', 'XX.XX%'], ['Company Name', 'XX.XX%', 'XX.XX%'], ['Company Name', 'XX.XX%', 'XX.XX%']] }] },
  'performance-chart': { cat: 'Performance', label: 'Performance Chart', desc: 'Data-driven line chart vs. benchmark.', blocks: [
    { k: 'h', text: 'Performance' }, { k: 'e', text: 'GROWTH OF $10,000 · MM/DD/YYYY – MM/DD/YYYY' },
    { k: 'chart', chart: 'line', rows: [['Period', 'Portfolio', 'Benchmark'], ['Q1', '0', '0'], ['Q2', '0', '0'], ['Q3', '0', '0'], ['Q4', '0', '0']] }] },
  'performance-table': { cat: 'Performance', label: 'Performance Table', desc: 'Returns across standard periods.', blocks: [
    { k: 'h', text: 'Performance' }, { k: 'e', text: 'AS OF MM/DD/YYYY' },
    { k: 't', rows: [['', 'YTD', '1 Yr', '3 Yr', '5 Yr', '10 Yr', 'Since Incep.'], ['Strategy (Gross)', ...dash(6)], ['Strategy (Net)', ...dash(6)], ['Benchmark', ...dash(6)]] }] },
  'performance-analytics': { cat: 'Performance', label: 'Performance Analytics', desc: 'Risk and return statistics.', blocks: [
    { k: 'h', text: 'Performance Analytics' }, { k: 't', rows: [['', 'Strategy', 'Benchmark'], ['Alpha', 'X.XX', 'X.XX'], ['Beta', 'X.XX', 'X.XX'], ['Excess Return', 'XX.XX%', '—'], ['Sharpe Ratio', 'X.XX', 'X.XX'], ['Standard Deviation', 'XX.XX%', 'XX.XX%']] }] },
  'fund-facts': { cat: 'Fund / Product', label: 'Fund Facts', desc: 'Fund-level label–value facts.', blocks: [
    { k: 'h', text: 'Fund Facts' }, { k: 'kv', rows: kv(['Inception Date', 'MM/DD/YYYY'], ['Fund AUM', '$XXXM'], 'Asset Class', ['Number of Holdings', 'XX'], ['Benchmark', 'Benchmark']) }] },
  'fund-terms': { cat: 'Fund / Product', label: 'Fund Terms', desc: 'Fees, liquidity and service providers.', blocks: [
    { k: 'h', text: 'Fund Terms' }, { k: 'kv', rows: kv(['Minimum Investment', '$X.XM'], ['Management Fee', 'X.XX%'], ['Performance Fee', 'XX%'], 'Subscriptions', 'Redemptions', 'Fund Administrator', 'Auditor', 'Legal Counsel') }] },
  'market-opportunity': { cat: 'Fund / Product', label: 'Market Opportunity', desc: 'Market-size statistics and context.', blocks: [
    { k: 'h', text: 'Market Opportunity' }, { k: 'p', text: 'Enter introduction.' }, { k: 'm', items: [['$X.XB', 'Market Size'], ['XX%', 'Growth Rate'], ['XX+', 'Metric']] }] },
  'investment-case-study': { cat: 'Fund / Product', label: 'Featured Investment', desc: 'One investment with image and metrics.', blocks: [
    { k: 'h', text: 'Featured Investment' }, { k: 'img', w: 1, h: .9 }, { k: 'e', text: 'LOCATION · CATEGORY' }, { k: 'p', text: 'Enter description.' },
    { k: 'm', items: [['Enter value', 'Metric'], ['Enter value', 'Metric'], ['Enter value', 'Metric']] }] },
  'impact-metrics': { cat: 'Impact', label: 'Sustainability Metrics', desc: 'ESG metrics vs. benchmark.', blocks: [
    { k: 'h', text: 'Sustainability Metrics' }, { k: 'e', text: 'AS OF MM/DD/YYYY' },
    { k: 'm', items: [['XX%', 'Less carbon intensity than Benchmark'], ['XX%', 'Greater board diversity than Benchmark'], ['XX%', 'Metric vs. Benchmark']] }, { k: 'cap', text: 'Source: Enter source' }] },
  'key-metrics': { cat: 'Document', label: 'Key Metrics', desc: 'Large-number KPI cards.', blocks: [
    { k: 'm', items: [['$X.XB', 'Assets Under Management'], ['XX+', 'Years Experience'], ['XX%', 'Metric']] }] },
  'quote': { cat: 'Document', label: 'Quote / Philosophy', desc: 'Prominent quote with attribution.', blocks: [
    { k: 'q', text: '“Enter quote or investment philosophy statement.”' }, { k: 'e', text: '— NAME, TITLE' }] },
  'contact': { cat: 'Document', label: 'Contact', desc: 'Investor relations contact and website.', blocks: [
    { k: 'h', text: 'Contact' }, { k: 'p', text: 'Name, Title\nPhone: (XXX) XXX-XXXX\nEmail: name@company.com\nwww.company.com' }] },
  'disclosures': { cat: 'Document', label: 'Disclosures', desc: 'Legal and performance disclosures.', blocks: [
    { k: 'e', text: 'DISCLOSURES' }, { k: 'cap', text: 'Paste your approved disclosure text here. This text is kept exactly as entered.' }] },
  'footer': { cat: 'Document', label: 'Footer', desc: 'Website, phone and email line.', blocks: [
    { k: 'cap', text: 'Company Name  ·  www.company.com  ·  (XXX) XXX-XXXX  ·  name@company.com' }] },
  'sell-hero': { cat: 'Marketing', label: 'Product Hero', desc: 'Product name, value statement and hero image.', blocks: [
    { k: 'e', text: 'PRODUCT / SERVICE' }, { k: 'h1', text: 'Product or Service Name' }, { k: 'p', text: 'One-sentence value statement — what it does and who it is for.' }, { k: 'img', w: 1, h: 1.6 }] },
  'sell-benefits': { cat: 'Marketing', label: 'Key Benefits', desc: 'Three benefits with short descriptions.', blocks: [
    { k: 'h', text: 'Key Benefits' }, { k: 'c', cols: 3, items: [['Benefit', 'Enter description'], ['Benefit', 'Enter description'], ['Benefit', 'Enter description']] }] },
  'sell-features': { cat: 'Marketing', label: 'Features & Specs', desc: 'Feature–detail table.', blocks: [{k: 'h',text: 'Features'},{k: 'p',text: 'Feature\nFeature\nFeature\nFeature'}] },
  'sell-cta': { cat: 'Marketing', label: 'Call to Action', desc: 'Next step with contact details.', blocks: [
    { k: 'h', text: 'Ready to get started?' }, { k: 'p', text: 'Enter call to action.\nwww.company.com  ·  (XXX) XXX-XXXX' }] },
  'cs-header': { cat: 'Case Study', label: 'Case Study Header', desc: 'Client name, headline and result summary.', blocks: [
    { k: 'e', text: 'CASE STUDY' }, { k: 'h1', text: 'How Client Name Achieved a Result' }, { k: 'p', text: 'One-sentence summary of the outcome.' }] },
  'cs-snapshot': { cat: 'Case Study', label: 'Client Snapshot', desc: 'Client, industry, location and services.', blocks: [
    { k: 'h', text: 'At a Glance' }, { k: 'kv', rows: kv(['Client', 'Client Name'], ['Industry', 'Industry'], ['Location', 'City, State'], ['Services', 'Enter services']) }] },
  'cs-challenge': { cat: 'Case Study', label: 'The Challenge', desc: 'The problem the client faced.', blocks: [
    { k: 'h', text: 'The Challenge' }, { k: 'p', text: 'Enter description of the problem, its impact and why it mattered.' }] },
  'cs-solution': { cat: 'Case Study', label: 'The Solution', desc: 'What was done, in steps.', blocks: [
    { k: 'h', text: 'The Solution' }, { k: 'p', text: 'Enter introduction.' }, { k: 'c', cols: 3, items: [['01 · Step', 'Enter description'], ['02 · Step', 'Enter description'], ['03 · Step', 'Enter description']] }] },
  'cs-results': { cat: 'Case Study', label: 'The Results', desc: 'Outcome metrics with summary.', blocks: [
    { k: 'h', text: 'The Results' }, { k: 'm', items: [['XX%', 'Metric improved'], ['$XXK', 'Value created'], ['XX', 'Metric']] }, { k: 'p', text: 'Enter summary of results.' }] },
  'wp-cover': { cat: 'Report', label: 'Report Cover', desc: 'Title, subtitle, author and cover image.', blocks: [
    { k: 'e', text: 'WHITE PAPER · 2026' }, { k: 'h1', text: 'White Paper Title' }, { k: 'p', text: 'Subtitle that frames the problem and promise of the paper.' }, { k: 'img', w: 1, h: 2.6 }, { k: 'cap', text: 'Prepared by Company Name' }] },
  'wp-summary': { cat: 'Report', label: 'Executive Summary', desc: 'Key findings in brief.', blocks: [
    { k: 'h', text: 'Executive Summary' }, { k: 'p', text: 'Enter a short overview of the issue, approach and conclusions.' }, { k: 'c', cols: 3, items: [['Key Finding', 'Enter description'], ['Key Finding', 'Enter description'], ['Key Finding', 'Enter description']] }] },
  'wp-section': { cat: 'Report', label: 'Report Section', desc: 'Heading with long-form body text.', blocks: [
    { k: 'h', text: 'Section Heading' }, { k: 'p', text: 'Enter body text. Explain the context, evidence and implications. Keep paragraphs short and lead with the main point.' }] },
  'wp-data': { cat: 'Report', label: 'Supporting Data', desc: 'Chart with source note.', blocks: [
    { k: 'h', text: 'Supporting Data' }, { k: 'chart', chart: 'bar', rows: [['Category', 'Value'], ['Category A', '0'], ['Category B', '0'], ['Category C', '0'], ['Category D', '0']] }, { k: 'cap', text: 'Source: Enter source' }] },
  'wp-conclusion': { cat: 'Report', label: 'Conclusion', desc: 'Takeaways and recommendations.', blocks: [
    { k: 'h', text: 'Conclusion' }, { k: 'p', text: 'Enter conclusion and recommended next steps.' }] },
  'about-company': { cat: 'Report', label: 'About the Company', desc: 'Boilerplate about the publisher.', blocks: [
    { k: 'h', text: 'About Company Name' }, { k: 'p', text: 'Enter company boilerplate.' }] },
  'pr-cover': { cat: 'Proposal', label: 'Proposal Cover', desc: 'Proposal title, prepared-for and date.', blocks: [
    { k: 'e', text: 'PROPOSAL' }, { k: 'h1', text: 'Project Name' }, { k: 'p', text: 'Prepared for Client Name\nPrepared by Company Name\nMonth DD, 2026' }, { k: 'img', w: 1, h: 2.4 }] },
  'pr-understanding': { cat: 'Proposal', label: 'Our Understanding', desc: 'Client situation and goals.', blocks: [
    { k: 'h', text: 'Our Understanding' }, { k: 'p', text: 'Enter a summary of the client’s situation, needs and what success looks like.' }] },
  'pr-objectives': { cat: 'Proposal', label: 'Objectives', desc: 'Project goals.', blocks: [
    { k: 'h', text: 'Objectives' }, { k: 'c', cols: 3, items: [['Objective', 'Enter description'], ['Objective', 'Enter description'], ['Objective', 'Enter description']] }] },
  'pr-scope': { cat: 'Proposal', label: 'Scope of Work', desc: 'Deliverables table.', blocks: [
    { k: 'h', text: 'Scope of Work' }, { k: 't', rows: [['Deliverable', 'Description'], ['Deliverable', 'Enter description'], ['Deliverable', 'Enter description'], ['Deliverable', 'Enter description'], ['Deliverable', 'Enter description']] }] },
  'pr-timeline': { cat: 'Proposal', label: 'Timeline', desc: 'Project phases by week.', blocks: [
    { k: 'h', text: 'Timeline' }, { k: 'c', cols: 4, items: [['Phase 1', 'Weeks 1–2 · Enter description'], ['Phase 2', 'Weeks 3–4 · Enter description'], ['Phase 3', 'Weeks 5–6 · Enter description'], ['Phase 4', 'Weeks 7–8 · Enter description']] }] },
  'pr-investment': { cat: 'Proposal', label: 'Investment', desc: 'Pricing table with total.', blocks: [
    { k: 'h', text: 'Investment' }, { k: 't', rows: [['Item', 'Fee'], ['Item', '$X,XXX'], ['Item', '$X,XXX'], ['Item', '$X,XXX'], ['Total', '$XX,XXX']] }] },
  'pr-next': { cat: 'Proposal', label: 'Next Steps', desc: 'How to accept and begin.', blocks: [
    { k: 'h', text: 'Next Steps' }, { k: 'p', text: '1. Review and approve this proposal\n2. Sign the agreement\n3. Kick-off meeting' }] },
  // Quantitative fact sheet pieces (styled: real text styles, brand-colored headings, no auto-table)
  'q-masthead': { cat: 'Document', styled: true, label: 'Fact Sheet Masthead', desc: 'Full-width brand band: period, company name, tagline.', blocks: [
    { k: 'e', text: 'Q1 2026  ·  FACT SHEET', band: true }, { k: 'h1', text: 'Company Name', band: true }, { k: 'p', text: 'Enter tagline.', band: true }] },
  'q-firm-overview': { cat: 'About', styled: true, label: 'Firm Overview (Sidebar)', desc: 'Short description plus founding facts.', blocks: [
    { k: 'h', text: 'Firm Overview' }, { k: 'p', text: 'Enter a one-sentence description of the firm and its focus.' }, { k: 'kv', rows: kv(['Founded', '20XX'], ['Headquarters', 'City, State'], ['Ownership', 'XX% partner owned']) }] },
  'q-fund-details': { cat: 'Fund / Product', styled: true, label: 'Fund Details', desc: 'Structure, style, objective, asset class, holdings, inception.', blocks: [
    { k: 'h', text: 'Fund Details' }, { k: 'kv', rows: kv(['Structure', 'Enter structure'], ['Style', 'Enter style'], ['Objective', 'Enter objective'], ['Asset Class', 'Enter asset class'], ['Number of Holdings', 'XX–XX'], ['Inception', 'MM/DD/YYYY']) }] },
  'q-leadership': { cat: 'About', styled: true, label: 'Leadership (Sidebar)', desc: 'Leaders with title and experience.', blocks: [
    { k: 'h', text: 'Leadership' }, { k: 'c', cols: 1, items: [['Name, CFA', 'Title · XX+ years of experience'], ['Name, CFA', 'Title · XX+ years of experience'], ['Name', 'Title · XX+ years of experience']] }] },
  'q-performance': { cat: 'Performance', styled: true, label: 'Performance vs. Benchmark', desc: 'Gross, net and benchmark returns by period.', blocks: [
    { k: 'h', text: 'Performance' }, { k: 'e', text: 'AS OF MM/DD/YYYY' },
    { k: 't', rows: [['', 'Fund (Gross)', 'Fund (Net)', 'Benchmark'], ['Month', 'XX.X%', 'XX.X%', 'XX.X%'], ['1 Yr (annualized)', 'XX.X%', 'XX.X%', 'XX.X%'], ['3 Yr (annualized)', 'XX.X%', 'XX.X%', 'XX.X%'], ['Since Inception* (annualized)', 'XX.X%', 'XX.X%', 'XX.X%']] }] },
  'q-opportunity': { cat: 'Strategy', styled: true, label: 'The Opportunity', desc: 'Narrative on the market opportunity and approach.', blocks: [
    { k: 'h', text: 'The Opportunity' }, { k: 'p', text: 'Enter the opportunity: the sectors you focus on, why they matter now, and how your approach captures it.' }] },
  'q-themes': { cat: 'Strategy', styled: true, label: 'Themes', desc: 'Short theme tags.', blocks: [
    { k: 'h', text: 'Secular Themes' }, { k: 'c', cols: 3, items: [['Theme', ''], ['Theme', ''], ['Theme', ''], ['Theme', ''], ['Theme', '']] }] },
  'q-contact': { cat: 'Document', styled: true, label: 'Contact Band', desc: 'Full-width footer band: website, phone, email, address.', blocks: [
    { k: 'cap', text: 'www.company.com   ·   (XXX) XXX-XXXX   ·   info@company.com   ·   Street Address, City, ST 00000', band: true }] },
  'q-type-alloc': { cat: 'Portfolio', styled: true, label: 'Investment Type Allocation', desc: 'Donut chart by investment type.', blocks: [
    { k: 'h', text: 'Investment Type Allocation' }, { k: 'chart', chart: 'donut', rows: [['Type', 'Weight'], ['Venture', '0'], ['Growth', '0'], ['Buyout', '0'], ['Public Equity', '0']] }] },
  'q-fund-terms': { cat: 'Fund / Product', styled: true, label: 'Fund Terms (Detailed)', desc: 'Offering, minimum, eligibility, fees, liquidity, reporting.', blocks: [
    { k: 'h', text: 'Fund Terms' }, { k: 'kv', rows: kv(['Offering', 'Enter offering'], ['Minimum Investment', '$X.XM'], ['Investor Eligibility', 'Enter eligibility'], ['Management Fee', 'X.X%'], ['Performance Fee', 'XX%'], ['Subscriptions', 'Enter frequency'], ['Redemptions', 'Enter terms'], ['Reporting', 'Enter reporting']) }] },
  'q-providers': { cat: 'Fund / Product', styled: true, label: 'Service Providers', desc: 'Auditor, prime broker, administrator, legal.', blocks: [
    { k: 'h', text: 'Service Providers' }, { k: 'kv', rows: kv(['Fund Auditor', 'Firm Name'], ['Prime Broker', 'Firm Name'], ['Fund Administrator', 'Firm Name'], ['Fund Legal', 'Firm Name']) }] },
  'q-sector-alloc': { cat: 'Portfolio', styled: true, label: 'Sector Allocation', desc: 'Bar chart by sector.', blocks: [
    { k: 'h', text: 'Sector Allocation' }, { k: 'chart', chart: 'bar', rows: [['Sector', 'Weight %'], ['Sector A', '0'], ['Sector B', '0'], ['Sector C', '0'], ['Sector D', '0'], ['Sector E', '0']] }] },
  'q-top5': { cat: 'Portfolio', styled: true, label: 'Top 5 Holdings', desc: 'Holdings with sector and sub-sector.', blocks: [
    { k: 'h', text: 'Top 5 Holdings' }, { k: 't', rows: [['Holding', 'Sector', 'Sub-Sector'], ...Array.from({ length: 5 }, () => ['Company Name', 'Sector', 'Sub-Sector'])] }] },
  'q-sdg': { cat: 'Impact', styled: true, label: 'U.N. SDGs Addressed', desc: 'Goals with portfolio % of revenue.', blocks: [
    { k: 'h', text: 'U.N. Sustainable Development Goals Addressed' }, { k: 't', rows: [['Goal', 'SDG', 'Portfolio % of Revenue'], ['Goal Name', 'SDG X', 'XX.X%'], ['Goal Name', 'SDG X', 'XX.X%'], ['Goal Name', 'SDG X', 'XX.X%'], ['Goal Name', 'SDG X', 'XX.X%']] }] },
  'q-disclosures': { cat: 'Document', styled: true, label: 'Disclosures (Short)', desc: 'Footnotes and disclosure text.', blocks: [
    { k: 'cap', text: '*Since inception 01/01/20XX. Paste your approved disclosure text here.' }] },
  // Qualitative fact sheet pieces
  'ql-masthead': { cat: 'Document', styled: true, label: 'Qualitative Masthead', desc: 'Brand band: fact sheet title, fund name and period.', blocks: [
    { k: 'h1', text: 'Title of Fact Sheet', band: true }, { k: 'e', text: 'INVESTMENT FUND (TICKR)  ·  Q1 2026', band: true }] },
  'ql-quote': { cat: 'Document', styled: true, label: 'Tagline / Quote', desc: 'Prominent tagline or quote.', blocks: [
    { k: 'q', text: 'Enter tagline or quote.' }] },
  'ql-strategy': { cat: 'Strategy', styled: true, label: 'Investment Strategy', desc: 'Narrative about the strategy.', blocks: [
    { k: 'h', text: 'Investment Strategy' }, { k: 'p', text: 'Enter a description of the investment strategy: what you invest in, why, and what sets the approach apart.' }] },
  'ql-process': { cat: 'Strategy', styled: true, label: 'Investment Process', desc: 'Process narrative with key steps.', blocks: [
    { k: 'h', text: 'Investment Process' }, { k: 'p', text: 'Enter an overview of the investment process.' },
    { k: 'p', text: 'Step — Enter description\nStep — Enter description\nStep — Enter description\nStep — Enter description' }] },
  'ql-role': { cat: 'Strategy', styled: true, label: 'Role in Portfolio', desc: 'How the fund fits an investor portfolio.', blocks: [
    { k: 'h', text: 'Role in Portfolio' }, { k: 'p', text: 'Enter role\nEnter role\nEnter role\nEnter role\nEnter role' }] },
  'ql-firm-facts': { cat: 'About', styled: true, label: 'Firm Facts (Sidebar)', desc: 'Label–value firm facts.', blocks: [
    { k: 'h', text: 'Firm Facts' }, { k: 'kv', rows: kv(['Data point', 'XX.XX'], ['Data point', 'XX.XX'], ['Data point', 'XX.XX'], ['Data point', 'XX.XX'], ['Data point', 'XX.XX'], ['Data point', 'XX.XX']) }] },
  'ql-founders': { cat: 'About', styled: true, label: 'Founders', desc: 'Founders with title, experience and short bio.', blocks: [
    { k: 'h', text: 'Founders' }, { k: 'c', cols: 1, items: [['First Last Name', 'Title · XX years of experience\nEnter short bio.'], ['First Last Name', 'Title · XX years of experience\nEnter short bio.']] }] },
  'ql-fund-terms': { cat: 'Fund / Product', styled: true, label: 'Fund Terms (Sidebar)', desc: 'Compact fund terms.', blocks: [
    { k: 'h', text: 'Fund Terms' }, { k: 'kv', rows: kv(['Minimum Investment', '$X.XM'], ['Management Fee', 'X.XX%'], ['Performance Fee', 'XX%'], ['Liquidity', 'Enter terms']) }] },
  'ql-intro': { cat: 'Strategy', styled: true, label: 'Intro Statement', desc: 'Lead paragraph for the page.', blocks: [
    { k: 'q', text: 'Enter a short lead statement that frames the opportunity.' }] },
  'ql-market': { cat: 'Strategy', styled: true, label: 'Market Opportunities', desc: 'Narrative on the market opportunity.', blocks: [
    { k: 'h', text: 'Market Opportunities' }, { k: 'p', text: 'Enter a description of the market opportunity.' }] },
  'ql-tailwinds': { cat: 'Strategy', styled: true, label: 'Strong Tailwinds', desc: 'Drivers supporting the strategy.', blocks: [
    { k: 'h', text: 'Strong Tailwinds' }, { k: 'p', text: 'Enter the trends and drivers that support the strategy.' }] },
  'ql-targets': { cat: 'Fund / Product', styled: true, label: 'Targets', desc: 'Target investments, fund size and return.', blocks: [
    { k: 'h', text: 'Target Investments' }, { k: 'p', text: 'Enter target investment profile.' },
    { k: 'm', items: [['$XX.XM', 'Target Fund Size'], ['XX%', 'Target Return']] }] },
  'ql-fund-facts': { cat: 'Fund / Product', styled: true, label: 'Fund Facts (Sidebar)', desc: 'Label–value fund facts.', blocks: [
    { k: 'h', text: 'Fund Facts' }, { k: 'kv', rows: kv(['Inception', 'MM/DD/YYYY'], ['Structure', 'Enter structure'], ['Asset Class', 'Enter asset class'], ['Fund Size', '$XX.XM']) }] },
  'ql-partners': { cat: 'About', styled: true, label: 'Strategic Partners', desc: 'Partners and service providers.', blocks: [
    { k: 'h', text: 'Strategic Partners' }, { k: 'p', text: 'Partner Name\nPartner Name\nPartner Name' }] },
  'ql-quote2': { cat: 'Document', styled: true, label: 'Sidebar Quote', desc: 'Short quote with website.', blocks: [
    { k: 'q', text: '“Enter quote.”' }, { k: 'e', text: 'www.company.com' }] },
  'ql-disclosures': { cat: 'Document', styled: true, label: 'Disclosures (Qualitative)', desc: 'Disclosure text.', blocks: [
    { k: 'e', text: 'DISCLOSURES' }, { k: 'cap', text: 'Paste your approved disclosure text here.' }] },
  'ql-contact': { cat: 'Document', styled: true, label: 'Contact Band (Qualitative)', desc: 'Website, phone, email, address and short statement.', blocks: [
    { k: 'cap', text: 'www.company.com   ·   (XXX) XXX-XXXX   ·   info@company.com   ·   Street Address, City, ST 00000', band: true }] },
  // ===== Fact sheet architecture v3 (Quantitative / Qualitative / Hybrid) =====
  'v3-kpi': { cat: 'Performance', styled: true, label: 'Performance Snapshot (KPIs)', desc: 'Category line with 5 headline metrics.', blocks: [
    { k: 'e', text: 'Category \u00b7 Share Class \u00b7 As of XX/XX/XXXX' }, { k: 'm', items: [['X.XX%', 'YTD Return'], ['X.XX%', '1-Year Return'], ['X.XX%', '3-Year Annualized'], ['X.XX%', 'Since Inception'], ['$XX.XM', 'AUM']] }] },
  'v3-perf': { cat: 'Performance', styled: true, label: 'Performance vs. Benchmark', desc: 'Returns by period vs. benchmark, with difference.', blocks: [
    { k: 'h', text: 'Performance (%)' }, { k: 't', rows: [['', 'YTD', '1 Yr', '3 Yr', '5 Yr', '10 Yr', 'Incep.'], ['Fund', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['Benchmark', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['Difference', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX']] },
    { k: 'cap', text: 'Periods over one year are annualized. As of XX/XX/XXXX.' }] },
  'v3-growth': { cat: 'Performance', styled: true, label: 'Growth of $10,000', desc: 'Primary performance chart.', blocks: [
    { k: 'h', text: 'Growth of $10,000' }, { k: 'chart', chart: 'line', rows: [['Year', 'Fund', 'Benchmark'], ['2020', '10000', '10000'], ['2021', '11200', '10900'], ['2022', '10600', '10100'], ['2023', '12400', '11700'], ['2024', '13900', '12800'], ['2025', '15100', '13700']] }, { k: 'cap', text: 'Hypothetical growth of $10,000 since inception. Sample data, replace with your figures.' }] },
  'v3-chars': { cat: 'Portfolio', styled: true, label: 'Portfolio Characteristics', desc: 'Strategy vs. benchmark statistics.', blocks: [
    { k: 'h', text: 'Portfolio Characteristics' }, { k: 't', rows: [['', 'Strategy', 'Benchmark'], ['Number of Holdings', 'XX', 'XX'], ['Wtd. Avg. Market Cap', '$X.XB', '$X.XB'], ['P/E (Forward)', 'X.Xx', 'X.Xx'], ['Dividend Yield', 'X.XX%', 'X.XX%'], ['Active Share', 'XX%', '\u2014'], ['Turnover', 'XX%', '\u2014']] }] },
  'v3-risk': { cat: 'Performance', styled: true, label: 'Risk Statistics', desc: 'Risk metrics vs. benchmark.', blocks: [
    { k: 'h', text: 'Risk Statistics (3 Yr)' }, { k: 't', rows: [['', 'Strategy', 'Benchmark'], ['Alpha', 'X.XX', '\u2014'], ['Beta', 'X.XX', '1.00'], ['Sharpe Ratio', 'X.XX', 'X.XX'], ['Standard Deviation', 'XX.XX%', 'XX.XX%'], ['Upside Capture', 'XX%', '100%'], ['Downside Capture', 'XX%', '100%']] }] },
  'v3-sector': { cat: 'Portfolio', styled: true, label: 'Sector Allocation (Chart)', desc: 'Bar chart of sector weights.', blocks: [
    { k: 'h', text: 'Sector Allocation (%)' }, { k: 'chart', chart: 'bar', rows: [['Sector', 'Weight'], ['Sector One', '22'], ['Sector Two', '18'], ['Sector Three', '15'], ['Sector Four', '12'], ['Sector Five', '10'], ['Sector Six', '8'], ['Other', '15']] }] },
  'v3-asset': { cat: 'Portfolio', styled: true, label: 'Asset Allocation (Donut)', desc: 'Donut chart by asset class.', blocks: [
    { k: 'h', text: 'Asset Allocation (%)' }, { k: 'chart', chart: 'donut', rows: [['Asset Class', 'Weight'], ['Equity', '62'], ['Fixed Income', '24'], ['Alternatives', '8'], ['Cash', '6']] }] },
  'v3-holdings': { cat: 'Portfolio', styled: true, label: 'Top 10 Holdings', desc: 'Company name and % of net assets.', blocks: [
    { k: 'h', text: 'Top 10 Holdings' }, { k: 't', rows: [['Company','% of Net Assets'],['Company Name 1','X.XX%'],['Company Name 2','X.XX%'],['Company Name 3','X.XX%'],['Company Name 4','X.XX%'],['Company Name 5','X.XX%'],['Company Name 6','X.XX%'],['Company Name 7','X.XX%'],['Company Name 8','X.XX%'],['Company Name 9','X.XX%'],['Company Name 10','X.XX%'],['Total Top 10','XX.XX%']] }, { k: 'cap', text: 'As of XX/XX/XXXX. Holdings are subject to change.' }] },
  'v3-facts': { cat: 'Fund / Product', styled: true, label: 'Fund Facts', desc: 'Compact reference facts.', blocks: [{k: 'h',text: 'Fund Facts'},{k: 't',rows: [['Fund Detail','Value'],['Inception Date','XX/XX/XXXX'],['Benchmark','Enter benchmark'],['Total AUM','$XX.XM'],['Ticker','XXXXX'],['CUSIP','XXXXXXXXX'],['Gross / Net Expense','X.XX% / X.XX%'],['Portfolio Managers','Full Name, Full Name']],two: true}] },
  'v3-managers': { cat: 'Team', styled: true, label: 'Portfolio Managers', desc: 'Managers with role and tenure.', blocks: [
    { k: 'h', text: 'Portfolio Management' }, { k: 'kv', rows: kv(['Full Name, CFA', 'Lead PM \u00b7 XX yrs'], ['Full Name', 'Co-PM \u00b7 XX yrs']) }] },
  'v3-disc': { cat: 'Document', styled: true, label: 'Disclosures & Sources', desc: 'Performance disclosure, risk, benchmark and sources.', blocks: [
    { k: 'h', text: 'Important Disclosures' }, { k: 'cap', text: 'Performance data quoted represents past performance and does not guarantee future results. Investment return and principal value will fluctuate. Benchmark definitions, calculation methodology and data sources go here. Data as of XX/XX/XXXX. Paste your approved disclosure text.' }] },
  'v3-prop': { cat: 'Strategy', styled: true, label: 'Investment Proposition', desc: 'Headline and 1\u20133 sentence explanation.', blocks: [
    { k: 'img', w: 0.34, h: 1.2, side: true },
    { k: 'e', text: 'Investment Proposition' }, { k: 'h1', text: 'One clear headline that states what this strategy does' }, { k: 'p', text: 'In one to three sentences, explain what the strategy is designed to accomplish and why it matters to investors.' }] },
  'v3-prop-kpi': { cat: 'Strategy', styled: true, label: 'Proposition + Key Metrics', desc: 'Headline, explanation and 4 proof points.', blocks: [
    { k: 'h1', text: 'One clear headline that states the central investment idea' }, { k: 'p', text: 'One or two sentences explaining the strategy and the opportunity it targets.' },
    { k: 'm', items: [['X.XX%', '1-Year Return'], ['X.XX%', 'Since Inception'], ['$XX.XM', 'AUM'], ['XX', 'Holdings']] }] },
  'v3-highlights': { cat: 'Strategy', styled: true, label: 'Investment Highlights', desc: 'Four scannable differentiators.', blocks: [
    { k: 'h', text: 'Investment Highlights' }, { k: 'c', cols: 2, items: [['Highlight One', 'One or two sentences on this benefit.'], ['Highlight Two', 'One or two sentences on this benefit.'], ['Highlight Three', 'One or two sentences on this benefit.'], ['Highlight Four', 'One or two sentences on this benefit.']] }] },
  'v3-philosophy': { cat: 'Strategy', styled: true, label: 'Investment Philosophy', desc: 'Core beliefs with three pillars.', blocks: [
    { k: 'h', text: 'Investment Philosophy' }, { k: 'p', text: 'A short introduction to the beliefs that guide the strategy.' },
    { k: 'c', cols: 3, items: [['Quality', 'Short belief statement.'], ['Valuation', 'Short belief statement.'], ['Long-Term View', 'Short belief statement.']] }] },
  'v3-process': { cat: 'Strategy', styled: true, label: 'Investment Process', desc: 'Five-step process.', blocks: [
    { k: 'h', text: 'Investment Process' }, { k: 'c', cols: 5, items: [['1  Identify', 'Define the universe.'], ['2  Research', 'Fundamental analysis.'], ['3  Evaluate', 'Test against criteria.'], ['4  Construct', 'Size and diversify.'], ['5  Monitor', 'Review and rebalance.']] }] },
  'v3-timeline': { cat: 'Strategy', styled: true, label: 'Firm Timeline', desc: 'Five milestones by year.', blocks: [
    { k: 'h', text: 'Our Timeline' }, { k: 'c', cols: 5, items: [['2005', 'Firm founded.'], ['2010', 'Strategy launched.'], ['2015', 'Enter milestone.'], ['2020', 'Enter milestone.'], ['Today', 'Enter milestone.']] }] },
  'b3-cs-chart': { cat: 'Case Study', styled: true, label: 'Results Chart', desc: 'Before vs. after bar chart.', blocks: [
    { k: 'h', text: 'Results at a Glance' }, { k: 'chart', chart: 'bar', rows: [['Metric', 'Before', 'After'], ['Revenue', '40', '62'], ['Retention', '55', '78'], ['Efficiency', '35', '60'], ['Satisfaction', '60', '88']] }, { k: 'cap', text: 'Sample data. Replace with your results.' }] },
  'b3-wp-chart': { cat: 'White Paper', styled: true, label: 'Trend Chart', desc: 'Line chart supporting the analysis.', blocks: [
    { k: 'h', text: 'Trend Over Time' }, { k: 'chart', chart: 'line', rows: [['Year', 'Value'], ['2021', '12'], ['2022', '18'], ['2023', '16'], ['2024', '24'], ['2025', '31'], ['2026', '38']] }, { k: 'cap', text: 'Source: Enter source. Sample data.' }] },
  'b3-pr-budget': { cat: 'Proposal', styled: true, label: 'Investment Breakdown', desc: 'Donut of budget by phase.', blocks: [
    { k: 'h', text: 'Investment Breakdown' }, { k: 'chart', chart: 'donut', rows: [['Phase', 'Share'], ['Discovery', '15'], ['Build', '45'], ['Launch', '25'], ['Support', '15']] }] },
  'b3-ss-chart': { cat: 'Sell Sheet', styled: true, label: 'Impact Chart', desc: 'Bar chart of proof points.', blocks: [
    { k: 'h', text: 'Measured Impact' }, { k: 'chart', chart: 'bar', rows: [['Area', 'Improvement %'], ['Speed', '42'], ['Cost', '28'], ['Quality', '35'], ['Adoption', '50']] }] },
  'v3-holdings-pie': { cat: 'Portfolio', styled: true, label: 'Top 10 Holdings (Pie)', desc: 'Top 10 holdings as a donut chart.', blocks: [
    { k: 'h', text: 'Top 10 Holdings' }, { k: 'chart', chart: 'donut', rows: [['Company','% of Net Assets'],['Company 1','4.80'],['Company 2','4.10'],['Company 3','3.60'],['Company 4','3.20'],['Company 5','2.90'],['Company 6','2.60'],['Company 7','2.30'],['Company 8','2.10'],['Company 9','1.90'],['Company 10','1.70']] }, { k: 'cap', text: '% of net assets. Sample data.' }] },
  'v3-holdings-tree': { cat: 'Portfolio', styled: true, label: 'Top 10 Holdings (Tree Map)', desc: 'Top 10 holdings sized by weight.', blocks: [
    { k: 'h', text: 'Top 10 Holdings' }, { k: 'chart', chart: 'treemap', rows: [['Company','% of Net Assets'],['Company 1','4.80'],['Company 2','4.10'],['Company 3','3.60'],['Company 4','3.20'],['Company 5','2.90'],['Company 6','2.60'],['Company 7','2.30'],['Company 8','2.10'],['Company 9','1.90'],['Company 10','1.70']] }, { k: 'cap', text: '% of net assets. Sample data.' }] },
  'v3-leaders': { cat: 'About', styled: true, label: 'Leadership', desc: '1–4 leaders with photo, name, title and highlights.', blocks: [
    { k: 'h', text: 'Leadership' }, { k: 'ppl', cols: 4, items: [['Name, CFA', 'Chief Investment Officer'], ['Name, CFA', 'Portfolio Manager'], ['Name, CFP', 'Head of Research'], ['Name', 'Client Portfolio Manager']] },
    { k: 'c', cols: 4, items: [['Highlights', 'XX years of experience\nJoined the firm in 20XX\nLeads investment strategy'], ['Highlights', 'XX years of experience\nManages the core strategy\nPreviously at Firm Name'], ['Highlights', 'XX years of experience\nLeads the research team\nSector focus: Enter'], ['Highlights', 'XX years of experience\nPrimary client contact\nEnter a credential']] }] },
  'v3-perf-wide': { cat: 'Performance', styled: true, label: 'Performance Chart + Table (Full Width)', desc: 'Large growth line chart with returns table below.', blocks: [
    { k: 'h', text: 'Performance: Growth of $10,000' }, { k: 'chart', chart: 'line', rows: [['Year','Fund','Benchmark'],['2017','10000','10000'],['2018','10420','10310'],['2019','11890','11560'],['2020','12960','12480'],['2021','14820','14090'],['2022','13410','13050'],['2023','15280','14610'],['2024','17030','16120'],['2025','18640','17480'],['2026','19520','18230']], h: 2.4 },
    { k: 't', rows: [['', 'YTD', '1 Yr', '3 Yr', '5 Yr', '10 Yr', 'Since Incep.'], ['Fund', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['Benchmark', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['Difference', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX']] },
    { k: 'cap', text: 'Returns in %. Periods over one year are annualized. Sample data. As of XX/XX/XXXX.' }] },
  'v3-criteria': { cat: 'Strategy', styled: true, label: 'What We Look For', desc: 'Four selection pillars.', blocks: [
    { k: 'h', text: 'What We Look For' }, { k: 'c', cols: 2, items: [['Business Quality', 'Short explanation.'], ['Management', 'Short explanation.'], ['Financial Strength', 'Short explanation.'], ['Valuation', 'Short explanation.']] }] },
  'v3-construction': { cat: 'Portfolio', styled: true, label: 'Portfolio Construction', desc: 'How ideas become the portfolio.', blocks: [
    { k: 'h', text: 'Portfolio Construction' }, { k: 'kv', rows: kv(['Number of Holdings', 'XX\u2013XX'], ['Typical Position Size', 'X\u2013X%'], ['Buy Discipline', 'Enter approach'], ['Sell Discipline', 'Enter approach'], ['Time Horizon', 'X\u2013X years'], ['Risk Management', 'Enter approach']) }] },
  'v3-diff': { cat: 'Strategy', styled: true, label: 'Differentiators', desc: 'What makes the approach distinctive.', blocks: [
    { k: 'h', text: 'What Sets Us Apart' }, { k: 'p', text: 'Proprietary research process\nExperienced, stable team\nRepeatable, disciplined approach\nAlignment of interests' }] },
  'v3-team': { cat: 'Team', styled: true, label: 'Investment Team', desc: 'Team members with photo, role and experience.', blocks: [
    { k: 'h', text: 'Investment Team' }, { k: 'ppl', cols: 2, items: [['Full Name, CFA', 'Role \u00b7 XX years experience'], ['Full Name', 'Role \u00b7 XX years experience']] }] },
  'v3-fit': { cat: 'Strategy', styled: true, label: 'Strategy Fit', desc: 'Investment objective the strategy addresses.', blocks: [
    { k: 'h', text: 'Designed For' }, { k: 'p', text: 'Describe the investment objective this strategy addresses, such as long-term capital appreciation, income or diversification.' }] },
  'v3-glance': { cat: 'Fund / Product', styled: true, label: 'Strategy at a Glance', desc: 'Compact strategy facts.', blocks: [
    { k: 'h', text: 'Strategy at a Glance' }, { k: 'kv', rows: kv(['Inception', 'XX/XX/XXXX'], ['Asset Class', 'Enter asset class'], ['Benchmark', 'Enter benchmark'], ['Vehicle', 'Enter vehicles'], ['Strategy AUM', '$XX.XM']) }] },
  'v3-risks': { cat: 'Document', styled: true, label: 'Principal Risks', desc: 'Key risks summarized.', blocks: [
    { k: 'h', text: 'Principal Risks' }, { k: 'p', text: 'Summarize the most relevant risks of the strategy clearly and concisely.' }] },
  'v3-riskmgmt': { cat: 'Performance', styled: true, label: 'Risk Management', desc: 'Risk philosophy with supporting statistics.', blocks: [
    { k: 'h', text: 'Risk Management' }, { k: 'p', text: 'A short explanation of how risk is managed.' }, { k: 't', rows: [['', 'Strategy', 'Benchmark'], ['Beta', 'X.XX', '1.00'], ['Std. Deviation', 'XX.XX%', 'XX.XX%'], ['Sharpe Ratio', 'X.XX', 'X.XX'], ['Downside Capture', 'XX%', '100%'], ['Max Drawdown', '-XX.XX%', '-XX.XX%']] }] },
  'v3-cta': { cat: 'Document', styled: true, label: 'Learn More / Contact', desc: 'Website, email and phone.', blocks: [
    { k: 'h', text: 'Learn More' }, { k: 'kv', rows: kv(['Website', 'www.company.com'], ['Email', 'info@company.com'], ['Phone', 'XXX-XXX-XXXX']) }] },
  // ===== B2B architecture v3 (Sell Sheet / Case Study / White Paper / Proposal) =====
  'b3-ss-value': { cat: 'Marketing', styled: true, label: 'Value Proposition', desc: 'Category, headline and supporting statement.', blocks: [
    { k: 'img', w: 0.36, h: 1.3, side: true },
    { k: 'e', text: 'Product / Service Category' }, { k: 'h1', text: 'A specific, benefit-led headline about the outcome you deliver' }, { k: 'p', text: 'One or two sentences: what this is, who it is for and the business problem it solves.' }] },
  'b3-ss-benefits': { cat: 'Marketing', styled: true, label: 'Primary Benefits', desc: 'Four outcome-focused benefits.', blocks: [
    { k: 'h', text: 'Key Benefits' }, { k: 'c', cols: 2, items: [['Benefit One', 'The business outcome, in one sentence.'], ['Benefit Two', 'The business outcome, in one sentence.'], ['Benefit Three', 'The business outcome, in one sentence.'], ['Benefit Four', 'The business outcome, in one sentence.']] }] },
  'b3-ss-overview': { cat: 'Marketing', styled: true, label: 'What It Does', desc: 'Overview paragraph and core capabilities.', blocks: [
    { k: 'h', text: 'What It Does' }, { k: 'p', text: 'A short overview of what the product or service actually does.' },
    { k: 'kv', rows: kv(['Capability One', 'Short explanation'], ['Capability Two', 'Short explanation'], ['Capability Three', 'Short explanation'], ['Capability Four', 'Short explanation']) }] },
  'b3-ss-how': { cat: 'Marketing', styled: true, label: 'How It Works', desc: 'Four-step process.', blocks: [
    { k: 'h', text: 'How It Works' }, { k: 'c', cols: 4, items: [['1  Connect', 'Short explanation.'], ['2  Create', 'Short explanation.'], ['3  Review', 'Short explanation.'], ['4  Launch', 'Short explanation.']] }] },
  'b3-ss-proof': { cat: 'Marketing', styled: true, label: 'Proof Points', desc: 'Three proof metrics and a testimonial.', blocks: [
    { k: 'h', text: 'Proven Results' }, { k: 'm', items: [['XX%', 'Enter proof point'], ['XX', 'Enter proof point'], ['XX hrs', 'Enter proof point']] },
    { k: 'q', text: '\u201cAdd a short customer testimonial that reinforces the main benefit.\u201d \u2014 Name, Title, Company' }] },
  'b3-ss-usecases': { cat: 'Marketing', styled: true, label: 'Use Cases', desc: 'Three use cases.', blocks: [
    { k: 'h', text: 'Use Cases' }, { k: 'kv', rows: kv(['Use Case One', 'Problem and solution in one line'], ['Use Case Two', 'Problem and solution in one line'], ['Use Case Three', 'Problem and solution in one line']) }] },
  'b3-ss-diff': { cat: 'Marketing', styled: true, label: 'Why Choose Us', desc: 'Differentiators.', blocks: [
    { k: 'h', text: 'Why Choose Us' }, { k: 'p', text: 'Enter a specific differentiator\nEnter a specific differentiator\nEnter a specific differentiator' }] },
  'b3-ss-features': { cat: 'Marketing', styled: true, label: 'Feature Summary', desc: 'Compact feature table.', blocks: [{k: 'h',text: 'Features at a Glance'},{k: 'p',text: 'Feature One: ✓\nFeature Two: ✓\nFeature Three: ✓\nFeature Four: ✓\nFeature Five: ✓'}] },
  'b3-cta': { cat: 'Document', styled: true, label: 'Call to Action', desc: 'One primary next step with contact.', blocks: [
    { k: 'h', text: 'Book a Demo' }, { k: 'p', text: 'One sentence inviting the next step. Visit www.company.com, email info@company.com or call XXX-XXX-XXXX.' }] },
  'b3-legal': { cat: 'Document', styled: true, label: 'Legal / Sources', desc: 'Disclaimer, sources and copyright.', blocks: [
    { k: 'cap', text: '\u00a9 Company Name. Add any required disclaimer, source or legal language here.' }] },
  'b3-cs-head': { cat: 'Case Study', styled: true, label: 'Case Study Headline', desc: 'Identity and outcome-led headline.', blocks: [
    { k: 'img', w: 1, h: 1.4 },
    { k: 'e', text: 'Case Study \u00b7 Industry \u00b7 Solution' }, { k: 'h1', text: '[Customer] Achieves [Specific Result] with [Solution]' }] },
  'b3-cs-results-snap': { cat: 'Case Study', styled: true, label: 'Results Snapshot', desc: 'Three headline results.', blocks: [
    { k: 'm', items: [['XX%', 'Enter result'], ['XX\u00d7', 'Enter result'], ['XX wks', 'Enter result']] }] },
  'b3-cs-customer': { cat: 'Case Study', styled: true, label: 'Customer Overview', desc: 'Short customer context.', blocks: [
    { k: 'img', w: 1, h: 0.9 },
    { k: 'h', text: 'The Customer' }, { k: 'kv', rows: kv(['Company', 'Customer name'], ['Industry', 'Enter industry'], ['Size', 'Enter size'], ['Solution', 'Product / service used']) }] },
  'b3-cs-challenge': { cat: 'Case Study', styled: true, label: 'The Challenge', desc: 'Business pain and impact.', blocks: [
    { k: 'h', text: 'The Challenge' }, { k: 'p', text: 'What was happening, why it was a problem, the business impact and why the existing approach fell short.' }] },
  'b3-cs-objectives': { cat: 'Case Study', styled: true, label: 'Objectives', desc: 'What the customer needed.', blocks: [
    { k: 'h', text: 'Objectives' }, { k: 'p', text: 'Enter objective\nEnter objective\nEnter objective' }] },
  'b3-cs-solution': { cat: 'Case Study', styled: true, label: 'The Solution', desc: 'What was implemented and why.', blocks: [{k: 'h',text: 'The Solution'},{k: 'p',text: 'What was implemented\nWhy this approach was chosen\nProducts or services involved\nHow it was rolled out'}] },
  'b3-cs-approach': { cat: 'Case Study', styled: true, label: 'Implementation', desc: 'Four-phase approach.', blocks: [
    { k: 'h', text: 'Implementation' }, { k: 'c', cols: 4, items: [['Discovery', 'Week X'], ['Setup', 'Week X'], ['Launch', 'Week X'], ['Optimization', 'Ongoing']] }] },
  'b3-cs-results': { cat: 'Case Study', styled: true, label: 'Results (Before / After)', desc: 'Before/after table and impact chart.', blocks: [
    { k: 'h', text: 'The Results' }, { k: 't', rows: [['Metric', 'Before', 'After', 'Change'], ['Enter metric', 'XX', 'XX', 'XX%'], ['Enter metric', 'XX', 'XX', 'XX%'], ['Enter metric', 'XX', 'XX', 'XX%']] },
    { k: 'chart', chart: 'bar', rows: [['Metric', 'Before', 'After'], ['Metric A', '40', '72'], ['Metric B', '55', '80'], ['Metric C', '30', '64']] }, { k: 'cap', text: 'Sample data, replace with the customer\u2019s verified results.' }] },
  'b3-cs-quote': { cat: 'Case Study', styled: true, label: 'Customer Quote', desc: 'One strong quote.', blocks: [
    { k: 'q', text: '\u201cAdd one customer-approved quote that reinforces the result.\u201d \u2014 Name, Title, Company' }] },
  'b3-cs-takeaways': { cat: 'Case Study', styled: true, label: 'Why It Worked', desc: 'Key takeaways.', blocks: [{k: 'h',text: 'Why It Worked'},{k: 'p',text: 'Takeaway One: Short explanation.\nTakeaway Two: Short explanation.\nTakeaway Three: Short explanation.'}] },
  'b3-wp-cover': { cat: 'White Paper', styled: true, label: 'White Paper Cover', desc: 'Title, subtitle, author and date.', blocks: [
    { k: 'img', w: 1, h: 1.3 },
    { k: 'e', text: 'White Paper \u00b7 Month YYYY' }, { k: 'h1', text: 'A Clear Title That States the Subject' }, { k: 'p', text: 'A descriptive subtitle that explains the scope and the question this paper answers.' }, { k: 'kv', rows: kv(['Author', 'Name, Title'], ['Organization', 'Company Name']) }] },
  'b3-wp-summary': { cat: 'White Paper', styled: true, label: 'Executive Summary', desc: 'Issue, findings and recommendation.', blocks: [
    { k: 'h', text: 'Executive Summary' }, { k: 'p', text: 'Summarize the issue, why it matters, the key findings and the main recommendation so a reader can stop here and still understand the paper.' }] },
  'b3-wp-findings': { cat: 'White Paper', styled: true, label: 'Key Findings', desc: 'Three findings with evidence.', blocks: [
    { k: 'h', text: 'Key Findings' }, { k: 'c', cols: 3, items: [['Finding One', 'Evidence and short interpretation.'], ['Finding Two', 'Evidence and short interpretation.'], ['Finding Three', 'Evidence and short interpretation.']] }] },
  'b3-wp-context': { cat: 'White Paper', styled: true, label: 'The Business Issue', desc: 'What is changing and why now.', blocks: [{k: 'h',text: 'The Business Issue'},{k: 'p',text: 'Define what is changing, why it matters now, who is affected and what the consequences are.'},{k: 'p',text: 'What is happening today\nWho is affected and how\nThe cost of leaving it unchanged'}] },
  'b3-wp-analysis': { cat: 'White Paper', styled: true, label: 'Problem Analysis', desc: 'Current state in depth.', blocks: [{k: 'h',text: 'Current State'},{k: 'p',text: 'Explain the problem in depth: market conditions, existing workflows, cost pressures or technology changes.'},{k: 'p',text: 'What is happening today\nWho is affected and how\nThe cost of leaving it unchanged'}] },
  'b3-wp-data': { cat: 'White Paper', styled: true, label: 'Evidence & Data', desc: 'Chart, table and source.', blocks: [
    { k: 'h', text: 'What the Data Shows' }, { k: 'chart', chart: 'bar', rows: [['Category', 'Value'], ['Category A', '42'], ['Category B', '31'], ['Category C', '18'], ['Category D', '9']] },
    { k: 't', rows: [['Measure', 'Value', 'Source'], ['Enter measure', 'XX%', 'Source'], ['Enter measure', 'XX%', 'Source'], ['Enter measure', 'XX%', 'Source']] }, { k: 'cap', text: 'Sample data. Source: add citation.' }] },
  'b3-wp-implications': { cat: 'White Paper', styled: true, label: 'Implications', desc: 'Why the reader should care.', blocks: [
    { k: 'h', text: 'Implications' }, { k: 'p', text: 'What the evidence means, what happens if the issue is ignored and what changes because of these findings.' }] },
  'b3-wp-framework': { cat: 'White Paper', styled: true, label: 'Recommended Framework', desc: 'Problem, principle, action.', blocks: [
    { k: 'h', text: 'A Recommended Approach' }, { k: 't', rows: [['Problem', 'Principle', 'Action'], ['Enter problem', 'Enter principle', 'Enter action'], ['Enter problem', 'Enter principle', 'Enter action'], ['Enter problem', 'Enter principle', 'Enter action']] }] },
  'b3-wp-implement': { cat: 'White Paper', styled: true, label: 'Implementation Considerations', desc: 'People, process, technology.', blocks: [
    { k: 'h', text: 'Implementation Considerations' }, { k: 'kv', rows: kv(['People', 'Enter consideration'], ['Process', 'Enter consideration'], ['Technology', 'Enter consideration'], ['Budget & Timeline', 'Enter consideration'], ['Risk & Governance', 'Enter consideration']) }] },
  'b3-wp-example': { cat: 'White Paper', styled: true, label: 'Example', desc: 'Concrete example or mini case.', blocks: [
    { k: 'img', w: 1, h: 1 },
    { k: 'h', text: 'Example' }, { k: 'p', text: 'A concrete example that makes the recommendation real. Label hypothetical scenarios as hypothetical.' }] },
  'b3-wp-recs': { cat: 'White Paper', styled: true, label: 'Recommendations', desc: 'Prioritized next steps.', blocks: [
    { k: 'h', text: 'Recommendations' }, { k: 'p', text: '1. Enter recommendation\n2. Enter recommendation\n3. Enter recommendation\n4. Enter recommendation' }] },
  'b3-wp-conclusion': { cat: 'White Paper', styled: true, label: 'Conclusion', desc: 'Reinforce the central issue and direction.', blocks: [
    { k: 'h', text: 'Conclusion' }, { k: 'p', text: 'Reinforce the central issue, the key finding, the business implication and the recommended direction.' }] },
  'b3-about': { cat: 'Document', styled: true, label: 'About the Company', desc: 'Concise company and author background.', blocks: [
    { k: 'img', w: 0.3, h: 0.8, side: true },
    { k: 'h', text: 'About Company Name' }, { k: 'p', text: 'A concise statement of relevant expertise and positioning.' }] },
  'b3-wp-sources': { cat: 'Document', styled: true, label: 'Sources & References', desc: 'Citations and methodology.', blocks: [
    { k: 'h', text: 'Sources' }, { k: 'cap', text: '1. Source, publication, date.\n2. Source, publication, date.\n3. Methodology note.' }] },
  'b3-pr-cover': { cat: 'Proposal', styled: true, label: 'Proposal Cover', desc: 'Title, client and provider.', blocks: [
    { k: 'img', w: 1, h: 1.8 },
    { k: 'e', text: 'Proposal \u00b7 Month YYYY' }, { k: 'h1', text: 'Proposal Title for Client Name' }, { k: 'kv', rows: kv(['Prepared for', 'Name, Title, Client'], ['Prepared by', 'Name, Title, Company Name'], ['Date', 'Month DD, YYYY']) }] },
  'b3-pr-summary': { cat: 'Proposal', styled: true, label: 'Executive Summary', desc: 'Situation, need, solution and value.', blocks: [
    { k: 'h', text: 'Executive Summary' }, { k: 'p', text: 'From the client\u2019s perspective: their situation, the core need, the proposed solution, the expected value and why this approach fits.' }] },
  'b3-pr-needs': { cat: 'Proposal', styled: true, label: 'Our Understanding', desc: 'Situation, challenges, constraints.', blocks: [
    { k: 'h', text: 'Our Understanding of Your Needs' }, { k: 'kv', rows: kv(['Current Situation', 'Enter in the client\u2019s words'], ['Challenges', 'Enter challenges'], ['Constraints', 'Enter constraints'], ['Opportunity', 'Enter opportunity']) }] },
  'b3-pr-objectives': { cat: 'Proposal', styled: true, label: 'Objectives & Success Criteria', desc: 'Measurable objectives.', blocks: [
    { k: 'h', text: 'Objectives & Success Criteria' }, { k: 't', rows: [['Objective', 'Success Measure'], ['Enter objective', 'Enter measure'], ['Enter objective', 'Enter measure'], ['Enter objective', 'Enter measure']] }] },
  'b3-pr-solution': { cat: 'Proposal', styled: true, label: 'Proposed Solution', desc: 'Approach, components and rationale.', blocks: [{k: 'h',text: 'Proposed Solution'},{k: 'p',text: 'Component one, tied to a client need\nComponent two, tied to a client need\nComponent three, tied to a client need\nHow the pieces work together'}] },
  'b3-pr-scope': { cat: 'Proposal', styled: true, label: 'Scope & Deliverables', desc: 'Deliverables table.', blocks: [{k: 'h',text: 'Scope & Deliverables'},{k: 'p',text: 'What this engagement covers and what you will receive at each stage.'},{k: 'p',text: 'Deliverable one and its outcome\nDeliverable two and its outcome\nDeliverable three and its outcome\nWhat is out of scope'}] },
  'b3-pr-approach': { cat: 'Proposal', styled: true, label: 'Approach', desc: 'Five-phase methodology.', blocks: [{k: 'h',text: 'Our Approach'},{k: 'p',text: 'How we will work with you, from kickoff to launch, and how we keep the project on track.'},{k: 'p',text: 'Discover: align on goals and success measures\nDesign: shape the solution with your team\nDeliver: build, test and launch\nSupport: measure results and refine'}] },
  'b3-pr-timeline': { cat: 'Proposal', styled: true, label: 'Timeline & Milestones', desc: 'Phases and dates.', blocks: [
    { k: 'h', text: 'Timeline & Milestones' }, { k: 't', rows: [['Phase', 'Milestone', 'Date'], ['Phase 1', 'Enter milestone', 'MM/DD'], ['Phase 2', 'Enter milestone', 'MM/DD'], ['Phase 3', 'Enter milestone', 'MM/DD'], ['Launch', 'Go live', 'MM/DD']] }] },
  'b3-pr-roles': { cat: 'Proposal', styled: true, label: 'Roles & Responsibilities', desc: 'Your team, client team, third parties.', blocks: [
    { k: 'h', text: 'Roles & Responsibilities' }, { k: 'kv', rows: kv(['Our Team', 'Enter responsibilities'], ['Client Team', 'Enter responsibilities'], ['Third Parties', 'Enter responsibilities']) }] },
  'b3-pr-investment': { cat: 'Proposal', styled: true, label: 'Investment', desc: 'Pricing table and payment schedule.', blocks: [
    { k: 'h', text: 'Investment' }, { k: 't', rows: [['Item', 'Included', 'Fee'], ['Phase / Option One', 'Enter what is included', '$X,XXX'], ['Phase / Option Two', 'Enter what is included', '$X,XXX'], ['Optional', 'Enter optional item', '$X,XXX'], ['Total', '', '$XX,XXX']] }, { k: 'cap', text: 'Payment schedule: enter terms.' }] },
  'b3-pr-value': { cat: 'Proposal', styled: true, label: 'Expected Value', desc: 'Estimated ROI metrics.', blocks: [
    { k: 'h', text: 'Expected Value' }, { k: 'm', items: [['XX%', 'Estimated time saved'], ['$XX K', 'Estimated annual savings'], ['XX\u00d7', 'Estimated capacity']] }, { k: 'cap', text: 'Estimates, not guaranteed outcomes.' }] },
  'b3-pr-why': { cat: 'Proposal', styled: true, label: 'Why Us', desc: 'Relevant proof and a related case.', blocks: [
    { k: 'h', text: 'Why Company Name' }, { k: 'p', text: 'Relevant expertise\nSimilar work\nSpecialized capability' }, { k: 'kv', rows: kv(['Challenge', 'Related client challenge'], ['Solution', 'What we did'], ['Result', 'Measured outcome']) }] },
  'b3-pr-team': { cat: 'Proposal', styled: true, label: 'Engagement Team', desc: 'People on the engagement.', blocks: [
    { k: 'h', text: 'Your Team' }, { k: 'ppl', cols: 3, items: [['Full Name', 'Role \u00b7 Expertise'], ['Full Name', 'Role \u00b7 Expertise'], ['Full Name', 'Role \u00b7 Expertise']] }] },
  'b3-pr-assume': { cat: 'Proposal', styled: true, label: 'Assumptions & Exclusions', desc: 'Assumptions and what is not included.', blocks: [
    { k: 'h', text: 'Assumptions & Exclusions' }, { k: 'p', text: 'Enter assumption\nEnter client dependency\nNot included: enter exclusion\nRevisions: enter limit' }] },
  'b3-pr-terms': { cat: 'Proposal', styled: true, label: 'Terms', desc: 'Payment, validity and legal terms.', blocks: [
    { k: 'h', text: 'Terms' }, { k: 'cap', text: 'Payment terms, proposal validity, cancellation, intellectual property, confidentiality and change requests.' }] },
  'b3-pr-accept': { cat: 'Proposal', styled: true, label: 'Next Steps & Acceptance', desc: 'Next action with signature fields.', blocks: [
    { k: 'h', text: 'Next Steps' }, { k: 'p', text: '1. Approve proposal  2. Sign agreement  3. Schedule kickoff' }, { k: 'kv', rows: kv(['Client Signature', '______________________'], ['Name / Date', '______________________'], ['Provider Signature', '______________________']) }] },
  // Quantitative fact sheet v2 (client PDF) pieces
  'qn-objective': { cat: 'Fund / Product', styled: true, label: 'Investment Objective', desc: 'Short statement of the fund objective.', blocks: [
    { k: 'h', text: 'Investment Objective' }, { k: 'p', text: 'Enter the fund\u2019s investment objective in two or three sentences.' }] },
  'qn-overview': { cat: 'Fund / Product', styled: true, label: 'Fund Overview + Highlights', desc: 'Fund facts with highlight bullets.', blocks: [
    { k: 'h', text: 'Fund Overview' }, { k: 'kv', rows: kv(['Asset Class', 'Enter asset class'], ['Portfolio Benchmark', 'Enter benchmark'], ['Portfolio AUM', '$XX.XX']) },
    { k: 'sub', text: 'Highlights' }, { k: 'p', text: 'Enter a fund highlight\nEnter a fund highlight\nEnter a fund highlight' }] },
  'qn-fees': { cat: 'Fund / Product', styled: true, label: 'Fund Fees by Class', desc: 'Share classes with CUSIP and expense ratios.', blocks: [
    { k: 'h', text: 'Fund Fees' }, { k: 't', rows: [['Class', 'Ticker', 'CUSIP', 'Gross / Net'], ['Class A', 'ABCDE', 'XXXXXX-XX-X', 'XX% / XX%'], ['Class B', 'ABCDE', 'XXXXXX-XX-X', 'XX% / XX%'], ['Class C', 'ABCDE', 'XXXXXX-XX-X', 'XX% / XX%']] }] },
  'qn-returns': { cat: 'Performance', styled: true, label: 'Average Annual Total Returns', desc: 'Returns by class vs. benchmarks.', blocks: [
    { k: 'h', text: 'Average Annual Total Returns (%)' }, { k: 't', rows: [['Class', 'Ticker', 'YTD', '1 Yr', '3 Yr', '5 Yr', '10 Yr', 'Since Incep.'], ['A', 'ABCDE', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['B', 'ABCDE', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['C', 'ABCDE', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['Benchmark One', '', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['Benchmark Two', '', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX']] },
    { k: 'cap', text: 'Performance disclosure here. As of XX/XX/XXXX.' }] },
  'qn-growth': { cat: 'Performance', styled: true, label: 'Growth of $10,000', desc: 'Line chart of growth over time.', blocks: [
    { k: 'h', text: 'Growth of $10,000' }, { k: 'chart', chart: 'line', rows: [['Year', 'Series 1', 'Series 2', 'Series 3'], ['2020', '10', '10', '10'], ['2021', '18', '15', '13'], ['2022', '24', '20', '17'], ['2023', '33', '27', '21'], ['2024', '41', '32', '25']] }, { k: 'cap', text: 'Source: Enter source' }] },
  'qn-team': { cat: 'Team', styled: true, label: 'Management Team', desc: 'Portfolio managers with titles.', blocks: [
    { k: 'h', text: 'Management Team' }, { k: 'c', cols: 2, items: [['Full Name', 'Title / Role'], ['Full Name', 'Title / Role']] }] },
  'qn-firm': { cat: 'Company', styled: true, label: 'Firm Overview', desc: 'About the firm, why choose us, awards.', blocks: [
    { k: 'h', text: 'Firm Overview' }, { k: 'sub', text: 'About Us' }, { k: 'p', text: 'Enter a short description of the firm.' }, { k: 'sub', text: 'Why Our Company?' }, { k: 'p', text: 'Enter what sets the firm apart.' }, { k: 'sub', text: 'Fund Awards & Company Ratings' }, { k: 'p', text: 'Enter awards and ratings.' }] },
  'qn-holdings': { cat: 'Portfolio', styled: true, label: 'Top 10 Holdings', desc: 'Ten largest holdings in two columns.', blocks: [
    { k: 'h', text: 'Top 10 Holdings' }, { k: 'c', cols: 2, items: [['Holding 1', 'XX.XX%'], ['Holding 2', 'XX.XX%'], ['Holding 3', 'XX.XX%'], ['Holding 4', 'XX.XX%'], ['Holding 5', 'XX.XX%'], ['Holding 6', 'XX.XX%'], ['Holding 7', 'XX.XX%'], ['Holding 8', 'XX.XX%'], ['Holding 9', 'XX.XX%'], ['Holding 10', 'XX.XX%']] }] },
  'qn-sectors': { cat: 'Portfolio', styled: true, label: 'Top 10 Sectors (Chart)', desc: 'Bar chart of sector weights.', blocks: [
    { k: 'h', text: 'Top 10 Sectors' }, { k: 'chart', chart: 'bar', rows: [['Sector', 'Weight'], ['Sector One', '18'], ['Sector Two', '15'], ['Sector Three', '13'], ['Sector Four', '11'], ['Sector Five', '9'], ['Sector Six', '8'], ['Sector Seven', '7'], ['Sector Eight', '6'], ['Sector Nine', '5'], ['Sector Ten', '4']] }] },
  'qn-breakdown': { cat: 'Portfolio', styled: true, label: 'Portfolio Breakdown (Donut + Table)', desc: 'Donut chart with allocation values.', blocks: [
    { k: 'h', text: 'Portfolio Breakdown (%)' }, { k: 'chart', chart: 'donut', rows: [['Allocation', 'Weight'], ['Allocation One', '32'], ['Allocation Two', '24'], ['Allocation Three', '18'], ['Allocation Four', '14'], ['Allocation Five', '12']] }, { k: 'cap', text: 'As of XX/XX/XX' }] },
  'qn-allocation': { cat: 'Portfolio', styled: true, label: 'Asset Allocation (Donut + Table)', desc: 'Donut chart with asset allocation.', blocks: [
    { k: 'h', text: 'Asset Allocation (%)' }, { k: 'chart', chart: 'donut', rows: [['Allocation', 'Weight'], ['Allocation One', '40'], ['Allocation Two', '25'], ['Allocation Three', '15'], ['Allocation Four', '12'], ['Allocation Five', '8']] }, { k: 'cap', text: 'As of XX/XX/XX' }] },
  'qn-subscribe': { cat: 'Document', styled: true, label: 'Subscribe / Market Commentary', desc: 'Call to action for market commentary.', blocks: [
    { k: 'h', text: 'Subscribe to Our Market Commentary' }, { k: 'p', text: 'Enter a short invitation and link to subscribe. Visit www.company.com' }] },
  'qn-disclosures': { cat: 'Document', styled: true, label: 'Important Disclosures', desc: 'Full disclosure text.', blocks: [
    { k: 'h', text: 'Important Disclosures' }, { k: 'p', text: 'Paste your approved disclosure text here.' }] },
  // Quantitative fact sheet (from client example) pieces
  'qv-key-data': { cat: 'Performance', styled: true, label: 'Key Data (Chart + Table)', desc: 'Six data points shown as a bar chart with values.', blocks: [
    { k: 'h', text: 'Key Data' }, { k: 'chart', chart: 'bar', rows: [['Data point', 'Value'], ['Data point 1', '24'], ['Data point 2', '19'], ['Data point 3', '16'], ['Data point 4', '13'], ['Data point 5', '9'], ['Data point 6', '6']] },
    { k: 'kv', rows: kv(['Data point', 'XX.XX'], ['Data point', 'XX.XX'], ['Data point', 'XX.XX'], ['Data point', 'XX.XX'], ['Data point', 'XX.XX'], ['Data point', 'XX.XX']) }] },
  'qv-highlights': { cat: 'Strategy', styled: true, label: 'Fund Highlights (Two Columns)', desc: 'Two short paragraphs side by side.', blocks: [
    { k: 'c', cols: 2, items: [['Highlight', 'Enter a short highlight about the fund and its approach.'], ['Highlight', 'Enter a short highlight about the fund and its approach.']] }] },
  'qv-overview': { cat: 'Strategy', styled: true, label: 'Fund Overview (Long Form)', desc: 'Long-form overview paragraphs.', blocks: [
    { k: 'h', text: 'Overview' }, { k: 'p', text: 'Enter a detailed overview of the fund: background, strategy, positioning and outlook.' }, { k: 'p', text: 'Enter additional detail.' }] },
  'qv-aum': { cat: 'Fund / Product', styled: true, label: 'Key Figures', desc: 'Two large dollar figures with descriptions.', blocks: [
    { k: 'm', items: [['$XX.XXM', 'Enter description']] }, { k: 'm', items: [['$XX.XXM', 'Enter description']] }] },
  'qv-growth': { cat: 'Performance', styled: true, label: 'Growth Over Time (Chart)', desc: 'Line chart of assets or returns over time.', blocks: [
    { k: 'h', text: 'Growth Over Time' }, { k: 'chart', chart: 'line', rows: [['Period', 'Fund', 'Benchmark'], ['2021', '100', '100'], ['2022', '112', '106'], ['2023', '121', '113'], ['2024', '133', '119'], ['2025', '146', '126']] }, { k: 'cap', text: 'Source: Enter source' }] },
  // Quantitative fact sheet (revised) pieces
  'qn-masthead': { cat: 'Document', styled: true, label: 'Fund Masthead', desc: 'Brand band: period, fund name and company tagline.', blocks: [
    { k: 'e', text: 'Q1 2026', band: true }, { k: 'h1', text: 'Investment Fund Name', band: true }, { k: 'p', text: 'Company tagline goes here.', band: true }] },
  'qn-masthead2': { cat: 'Document', styled: true, label: 'Fund Masthead (Short)', desc: 'Compact brand band with fund name.', blocks: [
    { k: 'h1', text: 'Investment Fund Name', band: true }, { k: 'e', text: 'Q1 2026', band: true }] },
  'qn-firm-overview': { cat: 'About', styled: true, label: 'Firm Overview (Bullets)', desc: 'Firm highlights as bullets.', blocks: [
    { k: 'h', text: 'Firm Overview' }, { k: 'p', text: 'Enter firm highlight\nEnter firm highlight\nEnter firm highlight\nEnter firm highlight\nEnter firm highlight' }] },
  'qn-fund-overview': { cat: 'Fund / Product', styled: true, label: 'Fund Overview', desc: 'Asset class, style, benchmark, AUM and highlights.', blocks: [
    { k: 'h', text: 'Fund Overview' }, { k: 'kv', rows: kv(['Asset Class', 'Enter asset class'], ['Investment Style', 'Enter style'], ['Portfolio Benchmark', 'Benchmark'], ['Portfolio AUM', '$XX.XXM']) }, { k: 'p', text: 'Highlights: Enter fund highlights.' }] },
  'qn-objective': { cat: 'Strategy', styled: true, label: 'Investment Objective (Sidebar)', desc: 'Objective statement.', blocks: [
    { k: 'h', text: 'Investment Objective' }, { k: 'p', text: 'Enter the fund’s investment objective.' }] },
  'qn-fees': { cat: 'Fund / Product', styled: true, label: 'Fund Fees by Share Class', desc: 'Inception, CUSIP and expense ratios per class.', blocks: [
    { k: 'h', text: 'Fund Fees' }, { k: 't', rows: [['Class', 'Inception', 'CUSIP', 'Gross / Net'], ['A (ABCDE)', 'MM/DD/YY', 'XXXXXX-XX-X', 'X.XX% / X.XX%'], ['B (ABCDE)', 'MM/DD/YY', 'XXXXXX-XX-X', 'X.XX% / X.XX%'], ['C (ABCDE)', 'MM/DD/YY', 'XXXXXX-XX-X', 'X.XX% / X.XX%']] }] },
  'qn-about': { cat: 'About', styled: true, label: 'About Us', desc: 'Company description.', blocks: [
    { k: 'h', text: 'About Us' }, { k: 'p', text: 'Enter a short company description.' }] },
  'qn-why': { cat: 'About', styled: true, label: 'Why Our Company + Awards', desc: 'Reasons to choose the firm, awards and ratings.', blocks: [
    { k: 'h', text: 'Why Company Name?' }, { k: 'p', text: 'Enter reasons to invest with the firm.' }, { k: 'e', text: 'AWARDS & RATINGS' }, { k: 'p', text: 'Enter awards and ratings.' }] },
  'qn-returns': { cat: 'Performance', styled: true, label: 'Average Annual Total Returns', desc: 'Returns by share class with benchmarks.', blocks: [
    { k: 'h', text: 'Average Annual Total Returns (%)' }, { k: 'e', text: 'AS OF MM/DD/YYYY' },
    { k: 't', rows: [['Class', 'Ticker', 'YTD', '1 Yr', '3 Yr', '5 Yr', '10 Yr', 'Incep.'], ['A', 'ABCDE', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['B', 'ABCDE', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['C', 'ABCDE', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['Benchmark One', '', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX'], ['Benchmark Two', '', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX', 'X.XX']] }] },
  'qn-growth': { cat: 'Performance', styled: true, label: 'Growth of Investment', desc: 'Line chart of growth over time, with source.', blocks: [
    { k: 'h', text: 'Growth of Investment' }, { k: 'e', text: 'MM/DD/YY – MM/DD/YY' },
    { k: 'chart', chart: 'line', rows: [['Period', 'Series 1', 'Series 2', 'Series 3'], ['P1', '0', '0', '0'], ['P2', '0', '0', '0'], ['P3', '0', '0', '0'], ['P4', '0', '0', '0'], ['P5', '0', '0', '0']] }, { k: 'cap', text: 'Source: Enter source' }] },
  'qn-team': { cat: 'About', styled: true, label: 'Management Team', desc: 'Two team members with title.', blocks: [
    { k: 'h', text: 'Management Team' }, { k: 'ppl', cols: 2, items: [['Full Name', 'Title / Role'], ['Full Name', 'Title / Role']] }] },
  'qn-perf-disc': { cat: 'Document', styled: true, label: 'Performance Disclosure', desc: 'Performance disclosure text.', blocks: [
    { k: 'cap', text: 'Performance disclosure. Paste your approved performance disclosure text here.' }] },
  'qn-top10': { cat: 'Portfolio', styled: true, label: 'Top 10 Holdings (List)', desc: 'Ten holdings.', blocks: [
    { k: 'h', text: 'Top 10 Holdings' }, { k: 't', rows: [['Holding', 'Weight'], ...Array.from({ length: 10 }, (_, i) => ['Holding ' + (i + 1), 'XX.XX'])] }] },
  'qn-sectors': { cat: 'Portfolio', styled: true, label: 'Top 10 Sectors', desc: 'Ten sectors with weight.', blocks: [
    { k: 'h', text: 'Top 10 Sectors' }, { k: 't', rows: [['Sector', 'Weight'], ...['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'].map(n => ['Sector ' + n, 'XX.XX'])] }] },
  'qn-subscribe': { cat: 'Marketing', styled: true, label: 'Subscribe / QR', desc: 'Newsletter call-out with QR placeholder and control number.', blocks: [
    { k: 'e', text: 'SUBSCRIBE TO OUR MARKET INSIGHTS' }, { k: 'img', w: .45, h: .55 }, { k: 'cap', text: 'www.company.com\nControl Number: XXXXXXXXX-XX' }] },
  'qn-breakdown': { cat: 'Portfolio', styled: true, label: 'Portfolio Breakdown', desc: 'Donut chart with totals table.', blocks: [
    { k: 'h', text: 'Portfolio Breakdown (%)' }, { k: 'e', text: 'AS OF MM/DD/YY' },
    { k: 'chart', chart: 'donut', rows: [['Allocation', '%'], ['Allocation One', '0'], ['Allocation Two', '0'], ['Allocation Three', '0'], ['Allocation Four', '0'], ['Allocation Five', '0']] }] },
  'qn-asset-alloc': { cat: 'Portfolio', styled: true, label: 'Asset Allocation (%)', desc: 'Allocation table with total.', blocks: [
    { k: 'h', text: 'Asset Allocation (%)' }, { k: 'e', text: 'AS OF MM/DD/YY' },
    { k: 't', rows: [['Allocation', '%'], ['Allocation One', 'XX.XX'], ['Allocation Two', 'XX.XX'], ['Allocation Three', 'XX.XX'], ['Allocation Four', 'XX.XX'], ['Allocation Five', 'XX.XX'], ['Total', '100.00']] }] },
  'qn-commentary': { cat: 'Performance', styled: true, label: 'Market Commentary', desc: 'Long-form commentary.', blocks: [
    { k: 'h', text: 'Commentary' }, { k: 'p', text: 'Enter quarterly commentary: market conditions, portfolio positioning, contributors and detractors, and outlook.' }] },
  'qn-contact': { cat: 'Document', styled: true, label: 'Contact Band (Phone · Email · Web)', desc: 'Footer band: phone, email, website.', blocks: [
    { k: 'cap', text: '(XXX) XXX-XXXX   |   info@company.com   |   www.company.com', band: true }] },
  // Hybrid fact sheet pieces
  'hy-masthead': { cat: 'Document', styled: true, label: 'Hybrid Masthead', desc: 'Brand band: title, fund name, period and asset class.', blocks: [
    { k: 'e', text: 'Q1 2026  ·  THE ASSET CLASS THAT IS OUR AREA OF EXPERTISE', band: true }, { k: 'h1', text: 'Title of Fact Sheet', band: true }, { k: 'p', text: 'Investment Fund (TICKR)', band: true }] },
  'hy-firm-facts': { cat: 'About', styled: true, label: 'Firm Facts (What We Do)', desc: 'What we do plus firm highlights.', blocks: [
    { k: 'h', text: 'Firm Facts' }, { k: 'p', text: 'What we do. Enter a short description of the firm.' }, { k: 'p', text: 'Enter highlight\nEnter highlight\nEnter highlight' }] },
  'hy-advisor': { cat: 'About', styled: true, label: 'Investment Advisor', desc: 'Advisor profile with experience list.', blocks: [
    { k: 'h', text: 'Investment Advisor' }, { k: 'img', w: .5, h: .6 }, { k: 'sub', text: 'Full Name' }, { k: 'e', text: 'TITLE HERE' }, { k: 'p', text: 'XX years investment management & finance experience' },
    { k: 'p', text: 'Experience line item\nExperience line item\nExperience line item\nExperience line item\nExperience line item' }] },
  'hy-strategy': { cat: 'Strategy', styled: true, label: 'Investment Strategy (Hybrid)', desc: 'Strategy narrative.', blocks: [
    { k: 'h', text: 'Investment Strategy' }, { k: 'p', text: 'Enter a description of the investment strategy.' }] },
  'hy-fund-details': { cat: 'Fund / Product', styled: true, label: 'Fund Details · Characteristics · Pricing', desc: 'Three-part fund data table.', blocks: [
    { k: 'h', text: 'Fund Details' }, { k: 'e', text: 'AS OF MM/DD/YYYY' },
    { k: 't', rows: [['Fund Details', '', 'Characteristics', '', 'Data & Pricing', ''], ['Objective', 'XX', 'Number of Holdings', 'XX', 'Net Assets', 'XX'], ['Asset Class', 'XX', 'Median Market Cap', 'XX', 'NAV', 'XX'], ['Investment Style', 'XX', 'Forward P/E', 'XX', 'Expense Ratio', 'XX'], ['Inception', 'XX', 'Dividend Yield', 'XX', 'Shares Outstanding', 'XX'], ['Benchmark', 'XX', 'EPS Growth', 'XX', 'Premium/Discount', 'XX'], ['CUSIP', 'XX', 'Active Share', 'XX', 'Closing Price', 'XX'], ['Primary Exchange', 'XX', '30-Day SEC Yield*', 'XX', 'Median 30-Day Spread', 'XX']] }] },
  'hy-performance': { cat: 'Performance', styled: true, label: 'Performance (Cumulative & Annualized)', desc: 'Returns by period incl. since-inception.', blocks: [
    { k: 'h', text: 'Performance' }, { k: 'e', text: 'AS OF MM/DD/YYYY' },
    { k: 't', rows: [['', '3 Mo', '6 Mo', 'YTD', '1 Yr', 'SI Cum.', 'SI Ann.'], ['Fund NAV', 'XX%', 'XX%', 'XX%', 'XX%', 'XX%', 'XX%'], ['Market Price', 'XX%', 'XX%', 'XX%', 'XX%', 'XX%', 'XX%'], ['Benchmark', 'XX%', 'XX%', 'XX%', 'XX%', 'XX%', 'XX%']] }] },
  'hy-top10': { cat: 'Portfolio', styled: true, label: 'Top 10 Holdings (Weight)', desc: 'Ten holdings with weight.', blocks: [
    { k: 'h', text: 'Top 10 Holdings' }, { k: 't', rows: [['Holding', 'Weight'], ...['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'].map(n => ['Item ' + n, 'XX%'])] }] },
  'hy-contributors': { cat: 'Portfolio', styled: true, label: 'Top & Bottom 5 Contributors', desc: 'Issue, return and contribution.', blocks: [
    { k: 'h', text: 'Top 5 Contributors' }, { k: 't', rows: [['Issue Name', 'Return', 'Contribution'], ...Array.from({ length: 5 }, (_, i) => ['Item ' + (i + 1), 'XX%', 'XX%'])] },
    { k: 'h', text: 'Bottom 5 Contributors' }, { k: 't', rows: [['Issue Name', 'Return', 'Contribution'], ...Array.from({ length: 5 }, (_, i) => ['Item ' + (i + 1), 'XX%', 'XX%'])] }] },
  'hy-perf-disc': { cat: 'Document', styled: true, label: 'Performance Disclosure (Hybrid)', desc: 'Performance disclosure text.', blocks: [
    { k: 'cap', text: '*Performance disclosure. Paste your approved performance disclosure text here.' }] },
  'hy-role': { cat: 'Strategy', styled: true, label: 'Role in Portfolio (Narrative)', desc: 'How the fund fits a portfolio.', blocks: [
    { k: 'h', text: 'Role in Portfolio' }, { k: 'p', text: 'Enter how the fund fits within an investor portfolio.' }] },
  'hy-timeline': { cat: 'About', styled: true, label: 'Timeline (7 Steps)', desc: 'Seven timeline items.', blocks: [
    { k: 'h', text: 'Timeline' }, { k: 'c', cols: 1, items: Array.from({ length: 7 }, (_, i) => ['Timeline Item ' + (i + 1), 'Enter description']) }] },
  'hy-contact': { cat: 'Document', styled: true, label: 'Contact (Sidebar)', desc: 'Address, phone, email, website, QR and subscribe.', blocks: [
    { k: 'h', text: 'Contact' }, { k: 'p', text: 'Street Address\nCity, ST 00000\nPhone: (XXX) XXX-XXXX\nEmail: info@company.com\nwww.company.com' },
    { k: 'e', text: 'SUBSCRIBE TO OUR MARKET INSIGHTS' }, { k: 'img', w: .4, h: .45 }, { k: 'cap', text: 'Control Number: XXXXXXXXX-XX' }] },
  'hy-sectors': { cat: 'Portfolio', styled: true, label: 'Sector Weights (Chart)', desc: 'Bar chart of nine sectors.', blocks: [
    { k: 'h', text: 'Sector Weights' }, { k: 'chart', chart: 'bar', rows: [['Sector', 'Weight %'], ...['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth'].map(n => [n + ' Sector', '0'])] }] },
  'hy-countries': { cat: 'Portfolio', styled: true, label: 'Country Allocations', desc: 'Donut chart by country.', blocks: [
    { k: 'h', text: 'Country Allocations' }, { k: 'chart', chart: 'donut', rows: [['Country', '%'], ['Country One', '32'], ['Country Two', '29.1'], ['Country Three', '7.8'], ['Country Four', '7.8'], ['Country Five', '7.8'], ['Country Six', '7.8']] }] },
  'hy-risk': { cat: 'Performance', styled: true, label: 'Risk & Return Ratios', desc: 'Tracking error, standard deviation, information ratio.', blocks: [
    { k: 'h', text: 'Risk & Return' }, { k: 'e', text: 'SINCE INCEPTION MM/DD/YY' },
    { k: 't', rows: [['Ratio', 'Fund', 'Benchmark'], ['Tracking Error', 'XX%', 'XX%'], ['Standard Deviation', 'XX%', 'XX%'], ['Information Ratio', 'XX%', 'XX%']] }] },
  'hy-disclosures': { cat: 'Document', styled: true, label: 'Disclosures (Hybrid)', desc: 'Full disclosure text.', blocks: [
    { k: 'e', text: 'DISCLOSURES' }, { k: 'cap', text: 'Paste your approved disclosure text here.' }] },
  'hy-web': { cat: 'Document', styled: true, label: 'Website Band', desc: 'Footer band with website.', blocks: [
    { k: 'cap', text: 'www.company.com', band: true }] }
};

// Starting templates for the New Project window. Each page lists the sections placed on it, top to bottom.
export const TEMPLATES = [
  { key: 'fs-quant', group: 'Financial Fact Sheet', name: 'Quantitative', desc: 'Performance, statistics, holdings and allocation', size: 'letter', pages: [
    [{ k: 'v3-kpi', col: 'TOP' }, { k: 'v3-perf-wide', col: 'TOP' }, { k: 'v3-facts', col: 'L' }, { k: 'v3-chars', col: 'R' }],
    [{ k: 'v3-holdings', col: 'L' }, { k: 'v3-sector', col: 'R' }, { k: 'v3-risk', col: 'R' }, { k: 'v3-leaders', col: 'F' }, { k: 'v3-disc', col: 'F' }]] },
  { key: 'fs-qual', group: 'Financial Fact Sheet', name: 'Qualitative', desc: 'Proposition, philosophy, process, team and timeline', size: 'letter', pages: [
    [{ k: 'v3-prop', col: 'TOP' }, { k: 'v3-glance', col: 'L' }, { k: 'v3-fit', col: 'L' }, { k: 'v3-highlights', col: 'R' }, { k: 'v3-philosophy', col: 'R' }, { k: 'v3-asset', col: 'L' }],
    [{ k: 'v3-process', col: 'TOP' }, { k: 'v3-construction', col: 'L' }, { k: 'v3-risks', col: 'L' }, { k: 'v3-criteria', col: 'R' }, { k: 'v3-leaders', col: 'F' }, { k: 'v3-timeline', col: 'F' }, { k: 'v3-disc', col: 'F' }]] },
  { key: 'fs-hybrid', group: 'Financial Fact Sheet', name: 'Hybrid', desc: 'Story and numbers: firm, strategy, performance, holdings and risk', size: 'letter', pages: [
    [{ k: 'hy-firm-facts', col: 'L' }, { k: 'hy-advisor', col: 'L' }, { k: 'hy-strategy', col: 'R' }, { k: 'hy-fund-details', col: 'R' }, { k: 'hy-performance', col: 'F' }],
    [{ k: 'hy-top10', col: 'L' }, { k: 'hy-contributors', col: 'L' }, { k: 'hy-sectors', col: 'R' }, { k: 'hy-risk', col: 'R' }, { k: 'hy-role', col: 'F' }, { k: 'hy-disclosures', col: 'F' }]] }
];

