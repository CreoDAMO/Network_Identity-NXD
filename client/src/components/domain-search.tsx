import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface DomainResult {
  domain: string;
  available: boolean;
  price?: string;
  premium?: boolean;
}

interface DomainSuggestion {
  domain: string;
  price: string;
  category: string;
}

export const DomainSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResults: DomainResult[] = [
        { domain: `${searchTerm}.nxd`, available: true, price: '0.1 NXD' },
        { domain: `${searchTerm}-app.nxd`, available: false },
        { domain: `${searchTerm}-pro.nxd`, available: true, price: '0.15 NXD', premium: true },
      ];

      const mockSuggestions: DomainSuggestion[] = [
        { domain: `${searchTerm}-web3.nxd`, price: '0.12 NXD', category: 'Tech' },
        { domain: `${searchTerm}-dao.nxd`, price: '0.18 NXD', category: 'Governance' },
        { domain: `${searchTerm}-nft.nxd`, price: '0.14 NXD', category: 'Digital Art' },
      ];

      setResults(mockResults);
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter your desired domain name..."
              className="bg-white/10 border-white/20 text-white placeholder-white/60"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchTerm.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isSearching ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Search
          </Button>
        </div>
      </Card>

      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-white">Search Results</h3>
          {results.map((result, index) => (
            <Card key={index} className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">{result.domain}</span>
                  {result.premium && <Badge variant="secondary">Premium</Badge>}
                </div>
                <div className="flex items-center space-x-4">
                  {result.available ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400">Available</span>
                      {result.price && (
                        <span className="text-white font-medium">{result.price}</span>
                      )}
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Register
                      </Button>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">Unavailable</span>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      )}

      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-white">Suggestions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{suggestion.domain}</span>
                    <Badge variant="outline">{suggestion.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400">{suggestion.price}</span>
                    <Button size="sm" variant="outline">
                      Register
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DomainSearch;