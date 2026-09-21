import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from './IconSymbol';

export interface StepItem {
  key: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  isCompleted: boolean;
  isActive: boolean;
}

export type TimelineStep = StepItem;

interface HorizontalStepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
  style?: ViewStyle;
}

export const HorizontalStepper: React.FC<HorizontalStepperProps> = ({
  steps,
  currentStep,
  style,
}) => {

  return (
    <View style={[styles.horizontalContainer, style]}>
      {steps.map((step, index) => {
        const isDone = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step}>
            <View style={styles.stepColumn}>
              <View
                style={[
                  styles.circle,
                  isDone && styles.circleDone,
                  isCurrent && styles.circleCurrent,
                ]}>
                {isDone ? (
                  <Text style={styles.checkmarkText}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.stepNumberText,
                      isCurrent && styles.stepNumberCurrent,
                    ]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  (isDone || isCurrent) && styles.stepLabelActive,
                ]}>
                {step}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[
                  styles.connectingLine,
                  index < currentStep && styles.connectingLineActive,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

export const StepIndicator = HorizontalStepper;

interface VerticalTimelineProps {

  steps: StepItem[];
  style?: ViewStyle;
}

export const VerticalTimeline: React.FC<VerticalTimelineProps> = ({
  steps,
  style,
}) => {
  return (
    <View style={[styles.verticalContainer, style]}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <View key={step.key} style={styles.timelineRow}>
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.timelineDot,
                  step.isCompleted && styles.timelineDotDone,
                  step.isActive && styles.timelineDotActive,
                ]}>
                {step.isCompleted ? (
                  <Text style={styles.dotCheckmark}>✓</Text>
                ) : step.isActive ? (
                  <View style={styles.pulseInnerDot} />
                ) : null}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.verticalLine,
                    step.isCompleted && styles.verticalLineDone,
                  ]}
                />
              )}
            </View>

            <View style={styles.timelineContent}>
              <View style={styles.titleTimestampRow}>
                <Text
                  style={[
                    styles.timelineTitle,
                    step.isActive && styles.timelineTitleActive,
                    step.isCompleted && styles.timelineTitleDone,
                  ]}>
                  {step.title}
                </Text>
                {step.timestamp ? (
                  <Text style={styles.timelineTimestamp}>{step.timestamp}</Text>
                ) : null}
              </View>
              {step.subtitle ? (
                <Text style={styles.timelineSubtitle}>{step.subtitle}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: BrandColors.white,
  },
  stepColumn: {
    alignItems: 'center',
    width: 65,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.gray100,
    borderWidth: 1.5,
    borderColor: BrandColors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  circleDone: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  circleCurrent: {
    backgroundColor: BrandColors.primaryLight,
    borderColor: BrandColors.primary,
    borderWidth: 2,
  },
  checkmarkText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray500,
  },
  stepNumberCurrent: {
    color: BrandColors.primary,
  },
  stepLabel: {
    fontSize: 11,
    color: BrandColors.gray400,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: BrandColors.gray800,
    fontWeight: '700',
  },
  connectingLine: {
    flex: 1,
    height: 2,
    backgroundColor: BrandColors.gray200,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  connectingLineActive: {
    backgroundColor: BrandColors.primary,
  },

  // Vertical timeline
  verticalContainer: {
    paddingVertical: Spacing.two,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  indicatorCol: {
    width: 32,
    alignItems: 'center',
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BrandColors.gray300,
  },
  timelineDotDone: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  timelineDotActive: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.primary,
    borderWidth: 3,
  },
  dotCheckmark: {
    color: BrandColors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  pulseInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.primary,
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: BrandColors.gray200,
    marginVertical: 4,
  },
  verticalLineDone: {
    backgroundColor: BrandColors.primary,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: Spacing.two,
    paddingBottom: Spacing.three,
  },
  titleTimestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.gray500,
  },
  timelineTitleActive: {
    color: BrandColors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  timelineTitleDone: {
    color: BrandColors.gray800,
  },
  timelineTimestamp: {
    fontSize: 12,
    color: BrandColors.gray400,
  },
  timelineSubtitle: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginTop: 2,
  },
});
