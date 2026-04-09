@echo off
echo ============================================
echo  BET^&WET TOTALIZATOR FULL VERIFICATION
echo ============================================
echo.

cd /d C:\Users\const\ClaudeLab\Noisore

echo --- ALL BET STRATEGIES, default noise 10,20,25,25,15,40 ---
echo.
for %%s in (uniform favorite longshot random weighted mix) do (
    echo === Strategy: %%s ===
    python betwet_verify.py --rounds 10000 --noise 10,20,25,25,15,40 --bet-strategy %%s
    echo.
)

echo.
echo --- DIFFERENT NOISE PROFILES, strategy=mix ---
echo.

echo === Pure (no noise) ===
python betwet_verify.py --rounds 10000 --noise 0,0,0,0,0,0 --bet-strategy mix
echo.

echo === Low noise ===
python betwet_verify.py --rounds 10000 --noise 5,10,10,10,5,20 --bet-strategy mix
echo.

echo === Default noise ===
python betwet_verify.py --rounds 10000 --noise 10,20,25,25,15,40 --bet-strategy mix
echo.

echo === High noise ===
python betwet_verify.py --rounds 10000 --noise 30,35,40,40,30,50 --bet-strategy mix
echo.

echo === Max chaos ===
python betwet_verify.py --rounds 10000 --noise 50,50,50,50,50,50 --bet-strategy mix
echo.

echo === Gradient ===
python betwet_verify.py --rounds 10000 --noise 5,10,20,30,40,50 --bet-strategy mix
echo.

echo.
echo --- DIFFERENT OVERROUND, strategy=mix, default noise ---
echo.

echo === Overround 3%% ===
python betwet_verify.py --rounds 10000 --noise 10,20,25,25,15,40 --bet-strategy mix --overround 1.03
echo.

echo === Overround 5%% (default) ===
python betwet_verify.py --rounds 10000 --noise 10,20,25,25,15,40 --bet-strategy mix --overround 1.05
echo.

echo === Overround 7%% ===
python betwet_verify.py --rounds 10000 --noise 10,20,25,25,15,40 --bet-strategy mix --overround 1.07
echo.

echo === Overround 10%% ===
python betwet_verify.py --rounds 10000 --noise 10,20,25,25,15,40 --bet-strategy mix --overround 1.10
echo.

echo ============================================
echo  DONE. If any shows LOSS - overround is too low.
echo ============================================
pause
