#include "ntl_bot_core.h"

#include <stdio.h>

/*
 * Example integration skeleton.
 *
 * Replace the fake arrays with data from your actual game runtime.
 * For vlither or any C engine, the adapter layer is the important part:
 * - fill self snake
 * - fill enemy snakes
 * - fill food list
 * - call ntl_bot_update()
 * - convert output target/angle/boost into your movement packet or input system
 */

int main(void) {
    NtlBotConfig cfg;
    NtlBotDecision decision;

    NtlSegment self_segments[] = {
        {95.0f, 100.0f, 0.0f, 0.0f, 0},
        {98.0f, 100.0f, 0.0f, 0.0f, 0},
    };

    NtlSnakeView self = {
        .id = 1,
        .x = 100.0f,
        .y = 100.0f,
        .fx = 0.0f,
        .fy = 0.0f,
        .heading = 0.0f,
        .speed = 5.78f,
        .mass = 5.0f,
        .length_score = 220.0f,
        .segments = self_segments,
        .segment_count = sizeof(self_segments) / sizeof(self_segments[0]),
        .alive = 1,
    };

    NtlSegment enemy_segments[] = {
        {140.0f, 110.0f, 0.0f, 0.0f, 0},
        {145.0f, 110.0f, 0.0f, 0.0f, 0},
    };

    NtlSnakeView enemies[] = {
        {
            .id = 2,
            .x = 150.0f,
            .y = 110.0f,
            .fx = 0.0f,
            .fy = 0.0f,
            .heading = 3.14f,
            .speed = 6.5f,
            .mass = 5.0f,
            .length_score = 180.0f,
            .segments = enemy_segments,
            .segment_count = sizeof(enemy_segments) / sizeof(enemy_segments[0]),
            .alive = 1,
        }
    };

    NtlFoodView foods[] = {
        {200.0f, 100.0f, 300.0f, 0},
        {130.0f, 160.0f, 120.0f, 0},
    };

    NtlWorldView world = {
        .center = {21600.0f, 21600.0f},
        .center_heading = 0.0f,
        .radius = 21600.0f,
        .enemy_snakes = enemies,
        .enemy_count = sizeof(enemies) / sizeof(enemies[0]),
        .foods = foods,
        .food_count = sizeof(foods) / sizeof(foods[0]),
    };

    ntl_bot_default_config(&cfg);
    ntl_bot_update(&world, &self, &cfg, &decision);

    printf("mode=%d target=(%.2f, %.2f) angle=%.3f boost=%d\n",
           (int)decision.mode,
           decision.target.x,
           decision.target.y,
           decision.aim_angle,
           decision.boost);

    return 0;
}
