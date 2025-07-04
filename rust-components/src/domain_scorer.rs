use pyo3::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use regex::Regex;
use rayon::prelude::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[pyclass]
pub struct DomainScore {
    #[pyo3(get, set)]
    pub overall_score: f64,
    #[pyo3(get, set)]
    pub length_score: f64,
    #[pyo3(get, set)]
    pub brandability_score: f64,
    #[pyo3(get, set)]
    pub keyword_score: f64,
    #[pyo3(get, set)]
    pub memorability_score: f64,
    #[pyo3(get, set)]
    pub pattern_score: f64,
    #[pyo3(get, set)]
    pub phonetic_score: f64,
    #[pyo3(get, set)]
    pub reasons: Vec<String>,
}

#[pymethods]
impl DomainScore {
    #[new]
    fn new() -> Self {
        DomainScore {
            overall_score: 0.0,
            length_score: 0.0,
            brandability_score: 0.0,
            keyword_score: 0.0,
            memorability_score: 0.0,
            pattern_score: 0.0,
            phonetic_score: 0.0,
            reasons: Vec::new(),
        }
    }

    fn to_json(&self) -> PyResult<String> {
        serde_json::to_string(self).map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))
    }
}

#[pyclass]
pub struct DomainScorer {
    tech_keywords: HashMap<String, f64>,
    scoring_weights: HashMap<String, f64>,
    vowels: Vec<char>,
    consonants: Vec<char>,
    phonetic_patterns: Vec<Regex>,
}

#[pymethods]
impl DomainScorer {
    #[new]
    fn new() -> PyResult<Self> {
        let mut tech_keywords = HashMap::new();
        
        // High-value tech keywords with weights
        let keywords = vec![
            ("ai", 100.0), ("crypto", 95.0), ("defi", 90.0), ("nft", 85.0),
            ("dao", 80.0), ("web3", 95.0), ("meta", 75.0), ("blockchain", 85.0),
            ("smart", 70.0), ("token", 75.0), ("coin", 70.0), ("digital", 65.0),
            ("virtual", 60.0), ("cyber", 65.0), ("tech", 60.0), ("app", 55.0),
            ("lab", 50.0), ("labs", 55.0), ("protocol", 80.0), ("network", 70.0),
            ("chain", 75.0), ("vault", 65.0), ("swap", 70.0), ("pool", 65.0),
            ("stake", 75.0), ("yield", 70.0), ("farm", 65.0), ("mint", 70.0),
            ("burn", 65.0), ("bridge", 75.0), ("dex", 80.0), ("cex", 70.0),
            ("fi", 60.0), ("pay", 55.0), ("bank", 50.0), ("trade", 60.0),
            ("exchange", 70.0), ("wallet", 75.0), ("node", 65.0), ("peer", 60.0),
            ("mesh", 55.0), ("cloud", 60.0), ("edge", 55.0), ("api", 50.0),
            ("sdk", 45.0), ("dev", 40.0), ("code", 45.0), ("build", 40.0),
            ("deploy", 45.0), ("scale", 50.0), ("zero", 55.0), ("one", 40.0),
            ("alpha", 60.0), ("beta", 50.0), ("gamma", 45.0), ("delta", 45.0),
            ("omega", 50.0), ("quantum", 70.0), ("fusion", 65.0), ("nexus", 75.0),
            ("core", 60.0), ("pro", 45.0), ("plus", 40.0), ("max", 45.0),
            ("ultra", 50.0), ("super", 45.0), ("hyper", 55.0), ("turbo", 50.0),
        ];
        
        for (keyword, weight) in keywords {
            tech_keywords.insert(keyword.to_string(), weight);
        }
        
        let mut scoring_weights = HashMap::new();
        scoring_weights.insert("length".to_string(), 0.20);
        scoring_weights.insert("brandability".to_string(), 0.25);
        scoring_weights.insert("keyword".to_string(), 0.25);
        scoring_weights.insert("memorability".to_string(), 0.15);
        scoring_weights.insert("pattern".to_string(), 0.10);
        scoring_weights.insert("phonetic".to_string(), 0.05);
        
        let vowels = vec!['a', 'e', 'i', 'o', 'u'];
        let consonants = vec![
            'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 
            'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'
        ];
        
        // Compile phonetic patterns for better scoring
        let phonetic_patterns = vec![
            Regex::new(r"([aeiou][bcdfghjklmnpqrstvwxyz]){2,}").unwrap(), // Alternating vowel-consonant
            Regex::new(r"([bcdfghjklmnpqrstvwxyz]{2}[aeiou])").unwrap(),   // Consonant clusters with vowels
            Regex::new(r"(ing|tion|ly|er|ed)$").unwrap(),                  // Common English endings
        ];
        
        Ok(DomainScorer {
            tech_keywords,
            scoring_weights,
            vowels,
            consonants,
            phonetic_patterns,
        })
    }
    
    #[pyo3(signature = (domain_name, tld = "nxd"))]
    fn score_domain(&self, domain_name: &str, tld: &str) -> PyResult<DomainScore> {
        let domain_lower = domain_name.to_lowercase();
        
        // Calculate individual scores
        let length_score = self.score_length(&domain_lower);
        let brandability_score = self.score_brandability(&domain_lower);
        let keyword_score = self.score_keywords(&domain_lower);
        let memorability_score = self.score_memorability(&domain_lower);
        let pattern_score = self.score_patterns(&domain_lower);
        let phonetic_score = self.score_phonetics(&domain_lower);
        
        // Calculate weighted overall score
        let overall_score = 
            length_score * self.scoring_weights["length"] +
            brandability_score * self.scoring_weights["brandability"] +
            keyword_score * self.scoring_weights["keyword"] +
            memorability_score * self.scoring_weights["memorability"] +
            pattern_score * self.scoring_weights["pattern"] +
            phonetic_score * self.scoring_weights["phonetic"];
        
        // Generate reasons
        let reasons = self.generate_reasons(
            &domain_lower, length_score, brandability_score, 
            keyword_score, memorability_score, pattern_score, phonetic_score
        );
        
        Ok(DomainScore {
            overall_score: (overall_score * 100.0).round() / 100.0,
            length_score: (length_score * 100.0).round() / 100.0,
            brandability_score: (brandability_score * 100.0).round() / 100.0,
            keyword_score: (keyword_score * 100.0).round() / 100.0,
            memorability_score: (memorability_score * 100.0).round() / 100.0,
            pattern_score: (pattern_score * 100.0).round() / 100.0,
            phonetic_score: (phonetic_score * 100.0).round() / 100.0,
            reasons,
        })
    }
    
    fn score_batch(&self, domain_names: Vec<&str>) -> PyResult<Vec<DomainScore>> {
        // Use parallel processing for batch scoring
        let scores: Vec<DomainScore> = domain_names
            .par_iter()
            .map(|&name| self.score_domain(name, "nxd").unwrap_or_else(|_| DomainScore::new()))
            .collect();
        
        Ok(scores)
    }
    
    fn analyze_character_composition(&self, domain_name: &str) -> PyResult<HashMap<String, f64>> {
        let domain_lower = domain_name.to_lowercase();
        let chars: Vec<char> = domain_lower.chars().collect();
        let total_chars = chars.len() as f64;
        
        let vowel_count = chars.iter().filter(|&&c| self.vowels.contains(&c)).count() as f64;
        let consonant_count = chars.iter().filter(|&&c| self.consonants.contains(&c)).count() as f64;
        let digit_count = chars.iter().filter(|c| c.is_ascii_digit()).count() as f64;
        let special_count = total_chars - vowel_count - consonant_count - digit_count;
        
        let mut composition = HashMap::new();
        composition.insert("vowel_ratio".to_string(), vowel_count / total_chars);
        composition.insert("consonant_ratio".to_string(), consonant_count / total_chars);
        composition.insert("digit_ratio".to_string(), digit_count / total_chars);
        composition.insert("special_ratio".to_string(), special_count / total_chars);
        composition.insert("vowel_consonant_balance".to_string(), 
            if vowel_count > 0.0 && consonant_count > 0.0 {
                (vowel_count.min(consonant_count) / vowel_count.max(consonant_count))
            } else { 0.0 }
        );
        
        Ok(composition)
    }
}

impl DomainScorer {
    fn score_length(&self, domain_name: &str) -> f64 {
        let length = domain_name.len();
        
        match length {
            1..=2 => 1.0,     // Ultra premium single/double char
            3..=4 => 0.95,    // Premium short domains
            5..=6 => 0.90,    // Excellent length
            7..=8 => 0.80,    // Good length
            9..=10 => 0.70,   // Acceptable
            11..=12 => 0.55,  // Getting long
            13..=15 => 0.40,  // Too long
            _ => 0.25,        // Way too long
        }
    }
    
    fn score_brandability(&self, domain_name: &str) -> f64 {
        let mut score = 0.5; // Base score
        
        // Vowel-consonant balance
        let vowel_count = domain_name.chars().filter(|&c| self.vowels.contains(&c)).count();
        let consonant_count = domain_name.chars().filter(|&c| self.consonants.contains(&c)).count();
        
        if vowel_count > 0 && consonant_count > 0 {
            let balance = (vowel_count.min(consonant_count) as f64) / (vowel_count.max(consonant_count) as f64);
            score += balance * 0.3;
        }
        
        // Avoid hard consonant clusters
        let hard_clusters = ["qq", "xx", "zz", "qx", "xz", "qz", "jsx", "pfx"];
        for cluster in &hard_clusters {
            if domain_name.contains(cluster) {
                score -= 0.15;
            }
        }
        
        // Bonus for pronounceable patterns
        if self.is_pronounceable(domain_name) {
            score += 0.2;
        }
        
        // Penalty for excessive repetition
        if self.has_excessive_repetition(domain_name) {
            score -= 0.2;
        }
        
        score.max(0.0).min(1.0)
    }
    
    fn score_keywords(&self, domain_name: &str) -> f64 {
        let mut score = 0.0;
        let mut max_keyword_score = 0.0;
        
        // Check for exact matches and partial matches
        for (keyword, weight) in &self.tech_keywords {
            if domain_name == keyword {
                // Exact match gets full weight
                score += weight / 100.0;
                max_keyword_score = max_keyword_score.max(weight / 100.0);
            } else if domain_name.contains(keyword) && keyword.len() >= 3 {
                // Partial match gets proportional weight
                let partial_weight = (weight / 100.0) * 0.6;
                score += partial_weight;
                max_keyword_score = max_keyword_score.max(partial_weight);
            }
        }
        
        // Normalize to 0-1 range, but allow bonus for multiple keywords
        let normalized_score = (score / 2.0).min(1.0);
        
        // Bonus for Web3/crypto specific terms
        let web3_bonus = if domain_name.contains("web3") || domain_name.contains("crypto") 
            || domain_name.contains("defi") || domain_name.contains("dao") {
            0.1
        } else {
            0.0
        };
        
        (normalized_score + web3_bonus).min(1.0)
    }
    
    fn score_memorability(&self, domain_name: &str) -> f64 {
        let mut score = 0.5; // Base score
        
        // Avoid common boring patterns
        let boring_patterns = ["123", "000", "999", "aaa", "abc", "xyz"];
        for pattern in &boring_patterns {
            if domain_name.contains(pattern) {
                score -= 0.2;
            }
        }
        
        // Bonus for unique but memorable patterns
        if self.has_memorable_pattern(domain_name) {
            score += 0.25;
        }
        
        // Penalty for too many numbers
        let digit_count = domain_name.chars().filter(|c| c.is_ascii_digit()).count();
        let digit_ratio = digit_count as f64 / domain_name.len() as f64;
        if digit_ratio > 0.5 {
            score -= 0.3;
        } else if digit_ratio > 0.3 {
            score -= 0.15;
        }
        
        // Bonus for alliteration
        if self.has_alliteration(domain_name) {
            score += 0.15;
        }
        
        score.max(0.0).min(1.0)
    }
    
    fn score_patterns(&self, domain_name: &str) -> f64 {
        let mut score = 0.5;
        
        // Check for good phonetic patterns
        for pattern in &self.phonetic_patterns {
            if pattern.is_match(domain_name) {
                score += 0.2;
            }
        }
        
        // Check for symmetrical patterns
        if self.is_symmetrical(domain_name) {
            score += 0.3;
        }
        
        // Check for rhythmic patterns
        if self.has_rhythm(domain_name) {
            score += 0.2;
        }
        
        score.max(0.0).min(1.0)
    }
    
    fn score_phonetics(&self, domain_name: &str) -> f64 {
        let mut score = 0.5;
        
        // Check if it follows English phonetic rules
        if self.follows_phonetic_rules(domain_name) {
            score += 0.3;
        }
        
        // Check for flow and rhythm
        if self.has_good_flow(domain_name) {
            score += 0.2;
        }
        
        score.max(0.0).min(1.0)
    }
    
    fn is_pronounceable(&self, domain_name: &str) -> bool {
        let chars: Vec<char> = domain_name.chars().collect();
        
        // Simple heuristic: avoid more than 3 consonants in a row
        let mut consonant_streak = 0;
        for &c in &chars {
            if self.consonants.contains(&c) {
                consonant_streak += 1;
                if consonant_streak > 3 {
                    return false;
                }
            } else {
                consonant_streak = 0;
            }
        }
        
        // Must have at least one vowel
        chars.iter().any(|&c| self.vowels.contains(&c))
    }
    
    fn has_excessive_repetition(&self, domain_name: &str) -> bool {
        let chars: Vec<char> = domain_name.chars().collect();
        
        // Check for more than 2 consecutive identical characters
        for i in 0..chars.len().saturating_sub(2) {
            if chars[i] == chars[i + 1] && chars[i + 1] == chars[i + 2] {
                return true;
            }
        }
        
        false
    }
    
    fn has_memorable_pattern(&self, domain_name: &str) -> bool {
        // Check for interesting patterns like palindromes, alternating patterns, etc.
        self.is_palindrome(domain_name) || self.has_alternating_pattern(domain_name)
    }
    
    fn is_palindrome(&self, domain_name: &str) -> bool {
        let chars: Vec<char> = domain_name.chars().collect();
        let reversed: Vec<char> = chars.iter().rev().cloned().collect();
        chars == reversed
    }
    
    fn has_alternating_pattern(&self, domain_name: &str) -> bool {
        let chars: Vec<char> = domain_name.chars().collect();
        if chars.len() < 4 {
            return false;
        }
        
        // Check for vowel-consonant alternation
        let mut alternating = true;
        for i in 0..chars.len() - 1 {
            let current_is_vowel = self.vowels.contains(&chars[i]);
            let next_is_vowel = self.vowels.contains(&chars[i + 1]);
            
            if current_is_vowel == next_is_vowel {
                alternating = false;
                break;
            }
        }
        
        alternating
    }
    
    fn has_alliteration(&self, domain_name: &str) -> bool {
        let chars: Vec<char> = domain_name.chars().collect();
        if chars.len() < 2 {
            return false;
        }
        
        // Check if first two characters are the same
        chars[0] == chars[1] && chars[0].is_alphabetic()
    }
    
    fn is_symmetrical(&self, domain_name: &str) -> bool {
        // Check for symmetrical character patterns
        let chars: Vec<char> = domain_name.chars().collect();
        let len = chars.len();
        
        if len < 3 {
            return false;
        }
        
        // Check if first and last characters match, second and second-to-last, etc.
        for i in 0..len / 2 {
            if chars[i] != chars[len - 1 - i] {
                return false;
            }
        }
        
        true
    }
    
    fn has_rhythm(&self, domain_name: &str) -> bool {
        // Simple rhythm check: alternating vowel/consonant patterns
        let chars: Vec<char> = domain_name.chars().collect();
        if chars.len() < 4 {
            return false;
        }
        
        let pattern: Vec<bool> = chars.iter()
            .map(|&c| self.vowels.contains(&c))
            .collect();
        
        // Check for repeating patterns
        for pattern_len in 2..=chars.len() / 2 {
            let mut is_rhythmic = true;
            for i in pattern_len..chars.len() {
                if pattern[i] != pattern[i % pattern_len] {
                    is_rhythmic = false;
                    break;
                }
            }
            if is_rhythmic {
                return true;
            }
        }
        
        false
    }
    
    fn follows_phonetic_rules(&self, domain_name: &str) -> bool {
        // Basic English phonetic rules
        let chars: Vec<char> = domain_name.chars().collect();
        
        // Avoid impossible combinations like "qw" without "u"
        for i in 0..chars.len().saturating_sub(1) {
            if chars[i] == 'q' && chars[i + 1] != 'u' {
                return false;
            }
        }
        
        true
    }
    
    fn has_good_flow(&self, domain_name: &str) -> bool {
        // Check for good flow by analyzing consonant-vowel transitions
        let chars: Vec<char> = domain_name.chars().collect();
        let mut good_transitions = 0;
        let mut total_transitions = 0;
        
        for i in 0..chars.len().saturating_sub(1) {
            let current_is_vowel = self.vowels.contains(&chars[i]);
            let next_is_vowel = self.vowels.contains(&chars[i + 1]);
            
            total_transitions += 1;
            
            // Good transitions: consonant to vowel, vowel to consonant
            if current_is_vowel != next_is_vowel {
                good_transitions += 1;
            }
        }
        
        if total_transitions == 0 {
            return false;
        }
        
        (good_transitions as f64 / total_transitions as f64) > 0.6
    }
    
    fn generate_reasons(
        &self,
        domain_name: &str,
        length_score: f64,
        brandability_score: f64,
        keyword_score: f64,
        memorability_score: f64,
        pattern_score: f64,
        phonetic_score: f64,
    ) -> Vec<String> {
        let mut reasons = Vec::new();
        
        // Length analysis
        match domain_name.len() {
            1..=4 => reasons.push("Excellent length - short and premium".to_string()),
            5..=8 => reasons.push("Good length - easy to type and remember".to_string()),
            9..=12 => reasons.push("Acceptable length".to_string()),
            _ => reasons.push("Long domain - may be harder to remember".to_string()),
        }
        
        // Brandability analysis
        if brandability_score > 0.8 {
            reasons.push("Highly brandable - easy to pronounce and remember".to_string());
        } else if brandability_score > 0.6 {
            reasons.push("Good brandability potential".to_string());
        } else if brandability_score < 0.4 {
            reasons.push("Challenging brandability - consider alternatives".to_string());
        }
        
        // Keyword analysis
        if keyword_score > 0.7 {
            reasons.push("Strong tech/crypto keyword relevance".to_string());
        } else if keyword_score > 0.4 {
            reasons.push("Some tech keyword relevance".to_string());
        } else if keyword_score < 0.2 {
            reasons.push("Limited tech keyword relevance".to_string());
        }
        
        // Memorability analysis
        if memorability_score > 0.7 {
            reasons.push("Highly memorable and distinctive".to_string());
        } else if memorability_score < 0.4 {
            reasons.push("May be challenging to remember".to_string());
        }
        
        // Pattern analysis
        if pattern_score > 0.7 {
            reasons.push("Excellent phonetic patterns".to_string());
        }
        
        // Phonetic analysis
        if phonetic_score > 0.7 {
            reasons.push("Great phonetic flow and pronunciation".to_string());
        }
        
        // Special characteristics
        if self.is_palindrome(domain_name) {
            reasons.push("Palindrome - unique and memorable".to_string());
        }
        
        if self.has_alliteration(domain_name) {
            reasons.push("Alliterative - catchy and memorable".to_string());
        }
        
        reasons
    }
}