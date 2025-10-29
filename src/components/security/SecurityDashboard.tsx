// src/components/security/SecurityDashboard.tsx - Security Analysis UI Component
import React, { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  AlertCircle,
  Info
} from 'lucide-react';
import { SecurityService, QualityScore, RiskAssessment, TokenConfig } from '../../services/securityService';
import { useConnection } from '@solana/wallet-adapter-react';

interface SecurityDashboardProps {
  tokenConfig: TokenConfig;
  onScoreUpdate?: (score: QualityScore) => void;
  onRiskUpdate?: (risks: RiskAssessment) => void;
}

/**
 * Security Score Card Component
 */
export const SecurityScoreCard: React.FC<{ score: QualityScore }> = ({ score }) => {
  const getScoreColor = (value: number) => {
    if (value >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (value >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (value >= 55) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (value >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (grade === 'B') return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (grade === 'C') return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-red-500 to-pink-500';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Security Score</h3>
        </div>
        <div className={`${getGradeColor(score.grade)} text-white px-3 py-1 rounded-full text-sm font-bold`}>
          {score.grade}
        </div>
      </div>

      {/* Overall Score */}
      <div className={`${getScoreColor(score.overall)} border rounded-lg p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Security</span>
          <span className="text-2xl font-bold">{score.overall}/100</span>
        </div>
        <div className="w-full bg-white bg-opacity-50 rounded-full h-2 mt-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${score.overall}%`,
              background: 'currentColor'
            }}
          />
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        {Object.entries(score.components).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="capitalize text-gray-600">{key}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="font-medium text-gray-900 w-8 text-right">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Risk Assessment Card Component
 */
export const RiskAssessmentCard: React.FC<{ assessment: RiskAssessment }> = ({ assessment }) => {
  const getRiskLevelConfig = (level: RiskAssessment['riskLevel']) => {
    switch (level) {
      case 'low':
        return {
          color: 'green',
          icon: CheckCircle,
          label: 'Low Risk',
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700'
        };
      case 'medium':
        return {
          color: 'yellow',
          icon: AlertCircle,
          label: 'Medium Risk',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700'
        };
      case 'high':
        return {
          color: 'orange',
          icon: AlertTriangle,
          label: 'High Risk',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700'
        };
      case 'critical':
        return {
          color: 'red',
          icon: XCircle,
          label: 'Critical Risk',
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700'
        };
    }
  };

  const config = getRiskLevelConfig(assessment.riskLevel);
  const RiskIcon = config.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Risk Assessment</h3>
        </div>
        <div className={`${config.bg} ${config.border} ${config.text} border px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
          <RiskIcon className="w-3 h-3" />
          {config.label}
        </div>
      </div>

      {/* Safety Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Safety Score</span>
          <span className="font-semibold text-gray-900">{assessment.safetyScore}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              assessment.safetyScore >= 70 ? 'bg-green-500' :
              assessment.safetyScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${assessment.safetyScore}%` }}
          />
        </div>
      </div>

      {/* Critical Issues */}
      {assessment.criticalIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 mb-1">Critical Issues</p>
              <ul className="text-xs text-red-700 space-y-1">
                {assessment.criticalIssues.map((issue, idx) => (
                  <li key={idx}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {assessment.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900 mb-1">Warnings</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                {assessment.warnings.slice(0, 3).map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
                {assessment.warnings.length > 3 && (
                  <li className="text-yellow-600">+ {assessment.warnings.length - 3} more warnings</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Risk Breakdown */}
      {assessment.risks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Risk Details</p>
          {assessment.risks.slice(0, 3).map((risk, idx) => (
            <div key={idx} className="text-xs p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">{risk.title}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  risk.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  risk.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {risk.severity}
                </span>
              </div>
              <p className="text-gray-600 mb-1">{risk.description}</p>
              <p className="text-gray-500 italic">→ {risk.recommendation}</p>
            </div>
          ))}
          {assessment.risks.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              + {assessment.risks.length - 3} more risks identified
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Recommendations Panel Component
 */
export const RecommendationsPanel: React.FC<{ recommendations: string[] }> = ({ recommendations }) => {
  if (recommendations.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-900">
            Excellent! No security recommendations at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-2 mb-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Security Recommendations</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span className="flex-1">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Security Dashboard Component
 */
export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  tokenConfig,
  onScoreUpdate,
  onRiskUpdate
}) => {
  const { connection } = useConnection();
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    analyzeToken();
  }, [tokenConfig]);

  const analyzeToken = async () => {
    setIsAnalyzing(true);
    try {
      const securityService = new SecurityService(connection);

      // Run parallel analysis
      const [score, risks] = await Promise.all([
        securityService.calculateQualityScore(tokenConfig),
        securityService.scanForRisks(tokenConfig)
      ]);

      setQualityScore(score);
      setRiskAssessment(risks);

      // Notify parent components
      if (onScoreUpdate) onScoreUpdate(score);
      if (onRiskUpdate) onRiskUpdate(risks);

    } catch (error) {
      console.error('[SecurityDashboard] Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
        <p className="text-sm text-gray-600">Analyzing token security...</p>
      </div>
    );
  }

  if (!qualityScore || !riskAssessment) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Security Analysis</h2>
        </div>
        <button
          onClick={analyzeToken}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <TrendingUp className="w-4 h-4" />
          Re-analyze
        </button>
      </div>

      {/* Score and Risk Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SecurityScoreCard score={qualityScore} />
        <RiskAssessmentCard assessment={riskAssessment} />
      </div>

      {/* Recommendations */}
      {qualityScore.recommendations.length > 0 && (
        <RecommendationsPanel recommendations={qualityScore.recommendations} />
      )}

      {/* Quick Actions */}
      {riskAssessment.riskLevel === 'low' && qualityScore.overall >= 85 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">Ready for Launch!</p>
              <p className="text-xs text-green-700 mt-1">
                Your token configuration meets security best practices and is ready for deployment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
