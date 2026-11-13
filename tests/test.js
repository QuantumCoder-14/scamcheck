// Run: node tests/test.js
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\/ <<CORE([\s\S]*?)\/\/ CORE>>/);
if (!m) { console.error('CORE block not found'); process.exit(1); }
const api = new Function(m[1] + '; return {analyse, analyseLink, extractLinks, RULES};')();
let fails = 0;
const check = (name, cond, extra) => { if (!cond) { fails++; console.log(`FAIL ${name}${extra ? ' — ' + extra : ''}`); } };
const ids = r => r.signals.map(s => s.id);

// ---------- the samples must score where they should ----------
const arrest = api.analyse('This is Inspector Sharma from CBI Cyber Cell. A case has been registered against you. An arrest warrant has been issued. Do not tell anyone or disconnect this video call. Transfer Rs 85000 to the government account.');
check('digital arrest scores high', arrest.score >= 70, 'score=' + arrest.score);
check('digital arrest verdict', arrest.verdict === 'Almost certainly a scam', arrest.verdict);
check('digital arrest rule fires', ids(arrest).includes('digital-arrest'));
check('secrecy rule fires', ids(arrest).includes('secrecy'));
check('untraceable payment fires', ids(arrest).includes('untraceable-payment'));
check('arrest has advice', arrest.advice.length > 0);

const kyc = api.analyse('Dear customer, your KYC is expiring today. Your account will be blocked within 24 hours. Kindly update your PAN immediately by clicking here: http://sbi-kyc-verify.xyz/update');
check('kyc scores high', kyc.score >= 70, 'score=' + kyc.score);
check('kyc rule fires', ids(kyc).includes('kyc-expiry'));
check('lookalike link flagged', kyc.links[0].flags.some(f => f.includes('imitates')), JSON.stringify(kyc.links[0]));

const parcel = api.analyse('Your parcel is held at customs due to illegal items found in your parcel. Pay delivery fee of Rs 249 to release it: https://bit.ly/3xK9pQz');
check('parcel rule fires', ids(parcel).includes('parcel-fee'));
check('shortener flagged', parcel.links[0].flags.some(f => f.includes('shortened')), JSON.stringify(parcel.links[0]));
check('parcel scores >= 40', parcel.score >= 40, 'score=' + parcel.score);

const task = api.analyse('Congratulations! Part time job available. Earn Rs 3000 per day by liking videos. Pay Rs 500 registration fee to unlock your tasks. Join our Telegram group for daily payout.');
check('task job fires', ids(task).includes('task-job'));
check('registration fee fires', ids(task).includes('registration-fee'));
check('task scores >= 40', task.score >= 40, 'score=' + task.score);

const real = api.analyse('Hey, are we still meeting at 5 near the station? I will be a bit late, stuck in traffic.');
check('normal message scores low', real.score < 15, 'score=' + real.score);
check('normal message verdict', real.verdict === 'No obvious scam signals', real.verdict);
check('normal message has no advice', real.advice.length === 0);

// ---------- boundaries ----------
const empty = api.analyse('');
check('empty input scores 0', empty.score === 0);
check('empty input has no signals', empty.signals.length === 0);
check('score never exceeds 100', api.analyse('CBI arrest warrant digital arrest do not tell anyone gift card anydesk OTP KYC '.repeat(20)).score === 100);

// ---------- specific rules ----------
check('otp rule', ids(api.analyse('Please share the OTP you just received')).includes('otp-request'));
check('remote access rule', ids(api.analyse('Install AnyDesk so we can verify your account')).includes('remote-access'));
check('collect request rule', ids(api.analyse('Enter your UPI PIN to receive the money')).includes('collect-request'));
check('prize rule', ids(api.analyse('Congratulations, you have won a lucky draw prize')).includes('prize'));
check('utility rule', ids(api.analyse('Your electricity connection will be disconnected tonight')).includes('utility-cut'));
check('loan rule', ids(api.analyse('Instant loan without documents, pre-approved')).includes('loan-app'));
check('no false positive on OTP word alone', ids(api.analyse('Your OTP for login is 4821. Do not share it with anyone.')).includes('otp-request') === false);

// ---------- link analysis ----------
check('bit.ly flagged', api.analyseLink('https://bit.ly/abc').flags.some(f => f.includes('shortened')));
check('raw IP flagged', api.analyseLink('http://192.168.1.1/pay').flags.some(f => f.includes('IP')));
check('http flagged', api.analyseLink('http://example.com').flags.some(f => f.includes('https')));
check('punycode flagged', api.analyseLink('http://xn--80ak6aa92e.com').flags.some(f => f.includes('punycode')));
check('suspicious tld flagged', api.analyseLink('https://secure-login.xyz').flags.some(f => f.includes('.xyz')));
check('real sbi domain not flagged as lookalike', !api.analyseLink('https://onlinesbi.sbi/').flags.some(f => f.includes('imitates')));
check('gov.in not flagged as lookalike', !api.analyseLink('https://cybercrime.gov.in/report').flags.some(f => f.includes('imitates')));
check('clean url has no flags', api.analyseLink('https://github.com/QuantumCoder-14').flags.length === 0);
check('extractLinks finds both', api.extractLinks('see https://a.com/x and www.b.org/y').length === 2);
check('extractLinks strips trailing dot', api.extractLinks('go to https://a.com/x.')[0] === 'https://a.com/x');

// ---------- determinism and shape ----------
const a = api.analyse('KYC expiring, click here'), b = api.analyse('KYC expiring, click here');
check('deterministic', JSON.stringify(a) === JSON.stringify(b));
check('signals sorted by weight', a.signals.every((s, i, arr) => i === 0 || arr[i - 1].weight >= s.weight));
check('every rule has an id, label and why', api.RULES.every(r => r.id && r.label && r.why && r.patterns.length));

console.log(fails ? `\n${fails} FAILURE(S)` : `ALL SCAMCHECK TESTS PASSED (${api.RULES.length} rules)`);
process.exit(fails ? 1 : 0);
