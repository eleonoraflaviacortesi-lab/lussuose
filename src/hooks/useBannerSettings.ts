import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BannerSettings {
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  bgColor: string;
  textColor: string;
  speed: number;
}

const defaultSettings: BannerSettings = {
  text1: 'MANCANO €{remaining} AL TRAGUARDO',
  text2: 'OBBIETTIVO FATTURATO AGENZIA €{target}',
  text3: 'FATTURATO A CREDITO €{fatturatoCredito}',
  text4: '',
  bgColor: '#000000',
  textColor: '#FFFFFF',
  speed: 40,
};

export const useBannerSettings = () => {
  const [settings, setSettings] = useState<BannerSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBannerSettings = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', [
          'banner_text_1', 'banner_text_2', 'banner_text_3', 'banner_text_4',
          'banner_bg_color', 'banner_text_color', 'banner_speed'
        ]);

      if (data) {
        const newSettings = { ...defaultSettings };
        data.forEach((item) => {
          if (item.key === 'banner_text_1') newSettings.text1 = item.value;
          if (item.key === 'banner_text_2') newSettings.text2 = item.value;
          if (item.key === 'banner_text_3') newSettings.text3 = item.value;
          if (item.key === 'banner_text_4') newSettings.text4 = item.value;
          if (item.key === 'banner_bg_color') newSettings.bgColor = item.value;
          if (item.key === 'banner_text_color') newSettings.textColor = item.value;
          if (item.key === 'banner_speed') newSettings.speed = Number(item.value) || 40;
        });
        setSettings(newSettings);
      }
      setIsLoading(false);
    };

    fetchBannerSettings();
  }, []);

  return { settings, isLoading };
};
